import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { JobScheduler } from '../../src/job_scheduler.js'

export default class ScheduleClear extends BaseCommand {
  static commandName = 'queue:scheduler:clear'
  static description = 'Clear all scheduled jobs'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ description: 'Clear jobs only from specific queue' })
  declare queue?: string

  @flags.boolean({ description: 'Skip confirmation prompt' })
  declare force: boolean

  async run(): Promise<void> {
    const currentJobs = await JobScheduler.list({ queue: this.queue as any })
    const count = currentJobs.length

    const queueFilter = this.queue ? ` in queue "${this.queue}"` : ''
    if (count === 0) {
      this.logger.info(`No scheduled jobs found${queueFilter}`)
      return
    }

    if (!this.force) {
      const confirmed = await this.prompt.confirm(
        `Are you sure you want to remove all ${count} scheduled jobs${queueFilter}?`,
      )

      if (!confirmed) {
        this.logger.info('Operation cancelled')
        return
      }
    }

    this.logger.info(`Clearing ${count} scheduled jobs${queueFilter}...`)

    const removedCount = await JobScheduler.clear({ queue: this.queue as any })

    this.logger.success(`Successfully removed ${removedCount} scheduled jobs${queueFilter}`)
  }
}
