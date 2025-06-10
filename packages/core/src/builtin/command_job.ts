import app from '@adonisjs/core/services/app'
import type { BaseCommand } from '@adonisjs/core/ace'
import { FsLoader, Kernel } from '@adonisjs/core/ace'

import { BaseJob } from '../job/base_job.js'
import { JobDispatcher } from '../job/job_dispatcher.js'
import type { BaseJobConstructor } from '../job/base_job.js'

export type ScheduledCommandData = {
  commandName: string
  args?: string[]
}

export type ScheduledCommandReturn = void

export default class CommandJob extends BaseJob<ScheduledCommandData, ScheduledCommandReturn> {
  async process(): Promise<ScheduledCommandReturn> {
    this.logger.info(`Running command: '${this.job.data.commandName}'`)

    await this.#makeCommandsKernel(this.job.data.commandName).then((ace) =>
      ace.exec(this.job.data.commandName, this.job.data.args || []),
    )
  }

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
        if (!commandName || !ace.getCommand(commandName)) {
          return fsLoader.getMetaData()
        }
        return []
      },
      getCommand(command) {
        return fsLoader.getCommand(command)
      },
    })

    return ace
  }

  static dispatch<J extends CommandJob>(
    this: BaseJobConstructor<J>,
    command: typeof BaseCommand,
    args?: string[],
  ) {
    return new JobDispatcher(this, { commandName: command.commandName, args })
  }
}
