import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import type { Queues } from '../../src/types/index.js'

export default class QueueDrain extends BaseCommand {
  static commandName = 'queue:drain'
  static description = 'Remove all waiting and active jobs from queues'

  @flags.boolean({
    name: 'force',
    description: 'Force the operation to run when in production',
    default: false,
  })
  declare force: boolean

  @flags.string({
    name: 'queue',
    description: 'The name of the queue to drain',
  })
  declare queue?: keyof Queues

  static options: CommandOptions = { startApp: true }

  async run() {
    const queueManager = await this.app.container.make('job.queueManager')

    if (this.app.inProduction && !this.force) {
      const confirmed = await this.prompt.confirm(
        'You are in production environment. Are you sure you want to drain queues?',
      )

      if (!confirmed) {
        this.logger.info('Operation cancelled')
        return
      }
    }

    await queueManager.drain(this.queue ? [this.queue] : undefined)

    this.ui.logger.success(
      this.queue
        ? `Drained all waiting and active jobs from queue "${this.queue}"`
        : 'Drained all waiting and active jobs from all queues',
    )
  }
}
