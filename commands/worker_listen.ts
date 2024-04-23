import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

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
    const queue = await this.app.container.make('queue.manager')

    if (this.list) {
      this.ui.logger.log('Available workers')
      const table = this.ui.table().head(['Name'])
      queue.getAllWorkerNames().forEach((w) => {
        table.row([w])
      })
      table.render()
      return await this.terminate()
    }

    if (this.workers.length === 0) {
      this.workers = queue.getAllWorkerNames()
    }

    this.logger.info(`Staring workers. Workers: ${this.workers}`)
    const runningWorkers = await queue.startWorkers(this.workers)

    this.app.terminating(async () => {
      this.logger.info('Terminating...')
      await Promise.all(runningWorkers.map((w) => w.close()))
      this.logger.info('Terminated')
    })
    this.app.listen('SIGINT', () => this.app.terminate())
  }
}
