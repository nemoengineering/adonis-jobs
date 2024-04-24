import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class QueueListen extends BaseCommand {
  static commandName = 'queue:listen'
  static description = 'Listen for jobs'

  @flags.array({ name: 'jobs', alias: 'j', description: 'The jobs you want to listen for' })
  declare jobs: string[]

  @flags.boolean({ name: 'list', alias: 'l', description: 'List all available jobs' })
  declare list: boolean

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  async run() {
    const queue = await this.app.container.make('job.manager')

    if (this.list) {
      this.ui.logger.log('Available workers')
      const table = this.ui.table().head(['Name'])
      queue.getAllJobNames().forEach((w) => {
        table.row([w])
      })
      table.render()
      return await this.terminate()
    }

    if (!this.jobs) {
      this.jobs = queue.getAllJobNames()
    }

    this.logger.info(`Staring workers for queues : ${this.jobs}`)
    const runningWorkers = await queue.startWorkers(this.jobs)

    this.app.terminating(async () => {
      this.logger.info('Terminating...')
      await Promise.all(runningWorkers.map((w) => w.close()))
    })
    this.app.listen('SIGINT', () => this.app.terminate())
  }
}
