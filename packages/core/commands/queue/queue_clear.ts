import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import type { Queues } from '../../src/types/index.js'

export default class QueueClear extends BaseCommand {
  static commandName = 'queue:clear'
  static description = 'Clear all jobs from queues'

  @flags.boolean({ name: 'force', description: 'Force the operation to run when in production' })
  declare force: boolean

  @flags.string({ name: 'queue', description: 'The name of the queue to clear' })
  declare queue?: keyof Queues

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const queueManager = await this.app.container.make('job.queueManager')

    if (this.app.inProduction && !this.force) {
      const confirmed = await this.prompt.confirm(
        'You are in production environment. Are you sure you want to clear queues?',
      )

      if (!confirmed) {
        this.logger.info('Operation cancelled')
        return
      }
    }

    await queueManager.clear(this.queue ? [this.queue] : undefined)

    this.ui.logger.success(
      this.queue
        ? `Cleared all jobs from queue "${this.queue}"`
        : 'Cleared all jobs from all queues',
    )
  }
}
