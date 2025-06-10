import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import type { JobState, Queues } from '../../src/types/index.js'

const JOB_STATES: JobState[] = [
  'completed',
  'wait',
  'active',
  'paused',
  'prioritized',
  'delayed',
  'failed',
]

export default class QueueClean extends BaseCommand {
  static commandName = 'queue:clean'
  static description = 'Clean jobs of a specific type and older than a specified grace period'

  @flags.boolean({
    name: 'force',
    description: 'Force the operation to run when in production',
    default: false,
  })
  declare force: boolean

  @flags.string({ name: 'queue', description: 'The name of the queue to clean' })
  declare queue?: keyof Queues

  @flags.number({
    name: 'grace',
    description: 'Grace period in milliseconds for jobs to be considered for cleaning',
    default: 0,
  })
  declare grace: number

  @flags.number({ name: 'limit', description: 'Maximum number of jobs to clean', default: 100 })
  declare limit: number

  @flags.string({ name: 'type', description: 'Type of jobs to clean', default: 'completed' })
  declare type: JobState

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const queue = await this.app.container.make('queue.manager')

    if (this.app.inProduction && !this.force) {
      const confirmed = await this.prompt.confirm(
        'You are in production environment. Are you sure you want to clean queues?',
      )

      if (!confirmed) {
        this.logger.info('Operation cancelled')
        return
      }
    }

    if (!JOB_STATES.includes(this.type)) {
      this.ui.logger.error(`Invalid type "${this.type}". Valid types are: ${JOB_STATES.join(', ')}`)
      return
    }

    this.ui.logger.info(
      this.queue
        ? `This will clean "${this.type}" jobs older than ${this.grace}ms from queue: ${this.queue} (limit: ${this.limit})`
        : `This will clean "${this.type}" jobs older than ${this.grace}ms from all queues (limit: ${this.limit})`,
    )

    const results = await queue.clean(this.queue ? [this.queue] : undefined, {
      grace: this.grace,
      limit: this.limit,
      type: this.type,
    })

    let totalCleaned = 0
    for (const result of results) {
      totalCleaned += result.count
      this.ui.logger.info(`Queue "${String(result.queue)}": cleaned ${result.count} jobs`)
    }

    this.ui.logger.success(`Successfully cleaned ${totalCleaned} jobs`)
  }
}
