import { args, BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { JobScheduler } from '../src/job_scheduler.js'

export default class ScheduleRemove extends BaseCommand {
  static commandName = 'queue:scheduler:remove'
  static description = 'Remove a scheduled job by its key'

  static options: CommandOptions = { startApp: true }

  @args.string({ description: 'Unique Key of the scheduled job to remove' })
  declare key: string

  async run(): Promise<void> {
    const existingJob = await JobScheduler.find(this.key)
    if (!existingJob) {
      this.logger.error(`Scheduled job with ID "${this.key}" not found`)
      return
    }

    this.logger.info(`Removing scheduled job: ${existingJob.name} (${this.key})`)

    const removed = await JobScheduler.remove(this.key)
    if (removed) {
      this.logger.success(`Scheduled job "${this.key}" removed successfully`)
    } else {
      this.logger.error(`Failed to remove scheduled job "${this.key}"`)
    }
  }
}
