import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { JobScheduler } from '../src/job_scheduler.js'

export default class ScheduleList extends BaseCommand {
  static commandName = 'queue:scheduler:list'
  static description = 'List all scheduled jobs'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ description: 'Filter by queue name' })
  declare queue?: string

  async run(): Promise<void> {
    const jobs = await JobScheduler.list({ queue: this.queue as any })

    const queueFilter = this.queue ? ` in queue "${this.queue}"` : ''
    if (jobs.length === 0) {
      this.logger.info(`No scheduled jobs found${queueFilter}`)
      return
    }
    this.logger.info(`Found ${jobs.length} scheduled jobs${queueFilter}`)

    const table = this.ui.table()
    table.head(['Key', 'Job', 'Pattern', 'Next Run', 'Queue', 'Timezone'])

    for (const job of jobs) {
      table.row([
        job.key,
        job.name,
        job.pattern || 'N/A',
        job.nextRun.toLocaleString(),
        job.queue,
        job.timezone || 'UTC',
      ])
    }

    table.render()
  }
}
