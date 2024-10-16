import { BaseCommand, FsLoader, Kernel } from '@adonisjs/core/ace'
import { Job, JobConstructor } from '../job.js'
import { JobDispatcher } from '../job_dispatcher.js'
import app from '@adonisjs/core/services/app'

export type ScheduledCommandData = {
  commandName: string
  args?: string[]
}

export type ScheduledCommandReturn = void

export default class CommandJob extends Job<ScheduledCommandData, ScheduledCommandReturn> {
  async process(): Promise<ScheduledCommandReturn> {
    this.logger.info(`Running command: '${this.job.data.commandName}'`)

    await this.#makeCommandsKernel(this.job.data.commandName).then((ace) =>
      ace.exec(this.job.data.commandName, this.job.data.args || [])
    )
  }

  async #makeCommandsKernel(commandName: string) {
    const ace = new Kernel(app)

    app.rcFile.commands.forEach((commandModule) => {
      ace.addLoader(() =>
        typeof commandModule === 'function' ? commandModule() : app.import(commandModule)
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

  static override dispatch<J extends Job<any, any>>(
    this: JobConstructor<J>,
    command: typeof BaseCommand,
    args?: string[]
  ) {
    return new JobDispatcher(this, { commandName: command.commandName, args })
  }
}
