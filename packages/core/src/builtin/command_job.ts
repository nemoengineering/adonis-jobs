import app from '@adonisjs/core/services/app'
import type { BaseCommand } from '@adonisjs/core/ace'
import { FsLoader, Kernel } from '@adonisjs/core/ace'

import { BaseJob } from '../job/base_job.js'
import type { PrebuiltJobData } from '../types/job.js'
import { JobDispatcher } from '../job/job_dispatcher.js'
import type { BaseJobConstructor } from '../job/base_job.js'

export type ScheduledCommandData = {
  commandName: string
  args?: string[]
}

export type ScheduledCommandReturn = void

export type CommandJobPrebuilt = PrebuiltJobData<ScheduledCommandData, { args?: string[] }>

export default class CommandJob extends BaseJob<ScheduledCommandData, ScheduledCommandReturn> {
  async #makeCommandsKernel(commandName: string) {
    const ace = new Kernel(app)

    app.rcFile.commands.forEach((commandModule) => {
      ace.addLoader(() =>
        typeof commandModule === 'function' ? commandModule() : app.import(commandModule),
      )
    })

    const fsLoader = new FsLoader<typeof BaseCommand>(app.commandsPath())
    ace.addLoader({
      async getMetaData() {
        if (!commandName || !ace.getCommand(commandName)) return fsLoader.getMetaData()
        return []
      },

      getCommand(command) {
        return fsLoader.getCommand(command)
      },
    })

    return ace
  }

  /**
   * Create a dispatcher for the command job
   */
  static #createDispatcher(
    jobConstructor: BaseJobConstructor,
    commandName: string,
    defaultArgs?: string[],
  ) {
    return (options?: { args?: string[] }) => {
      const finalArgs = options?.args || defaultArgs
      return new JobDispatcher(jobConstructor, { commandName, args: finalArgs })
    }
  }

  async process(): Promise<ScheduledCommandReturn> {
    this.logger.info(`Running command: '${this.job.data.commandName}'`)

    await this.#makeCommandsKernel(this.job.data.commandName).then((ace) =>
      ace.exec(this.job.data.commandName, this.job.data.args || []),
    )
  }

  static from<T extends typeof BaseCommand>(command: T, args?: string[]) {
    const jobConstructor = this as BaseJobConstructor
    const baseData = {
      job: jobConstructor,
      data: { commandName: command.commandName, args },
    } as CommandJobPrebuilt

    const dispatcher = this.#createDispatcher(jobConstructor, command.commandName, args)

    return { ...baseData, dispatch: dispatcher }
  }
}
