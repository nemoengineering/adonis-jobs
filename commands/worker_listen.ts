import { BaseCommand, flags } from '@adonisjs/core/ace'
import { WorkerManager } from '../src/worker_manager.js'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { configProvider } from '@adonisjs/core'

export default class WorkerListen extends BaseCommand {
  static commandName = 'worker:listen'
  static description = 'Listen for jobs'

  @flags.array({ name: 'workers', alias: 'w', description: 'The workers you want to run' })
  declare workers: string[]

  @flags.boolean({ name: 'list', alias: 'l', description: 'List all available workers' })
  declare list: boolean

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  async run() {
    const emitter = await this.app.container.make('emitter')
    const workerConfigProvider = await this.app.config.get<any>('worker')
    const config = await configProvider.resolve<any>(this.app, workerConfigProvider)

    const workerManager = new WorkerManager(emitter, config)

    if (this.list) {
      this.ui.logger.log('Available workers')
      const table = this.ui.table().head(['Name'])
      workerManager.getAllWorkerNames().forEach((w) => {
        table.row([w])
      })
      table.render()
      return await this.terminate()
    }

    if (this.workers.length === 0) {
      this.workers = workerManager.getAllWorkerNames()
    }

    this.logger.info(`Staring workers. Workers: ${this.workers}`)
    await workerManager.startWorkers(this.workers)

    this.app.terminating(async () => {
      this.logger.info('Terminating...')
      await workerManager.shutdown()
      this.logger.info('Terminated')
    })
    this.app.listen('SIGINT', () => this.app.terminate())
  }
}
