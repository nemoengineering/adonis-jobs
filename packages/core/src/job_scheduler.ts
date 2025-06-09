import queueManager from '../services/main.js'
import type { Queues } from './types/index.js'
import type { ScheduleJobOptions, ScheduledJobInfo } from './types/scheduler.js'

export class JobScheduler {
  /**
   * Schedule a recurring job using BullMQ Job Schedulers
   */
  static async schedule<T>(options: ScheduleJobOptions<T>): Promise<void> {
    const { key, job, data, repeat, options: jobOptions } = options

    const queueName = options.queue || job.defaultQueue || queueManager.config.defaultQueue
    const queue = queueManager.useQueue(queueName)

    await queue.upsertJobScheduler(key, repeat, {
      data,
      name: job.jobName,
      opts: jobOptions,
    })
  }

  /**
   * List all scheduled jobs across all queues
   */
  static async list(options: { queue?: keyof Queues } = {}): Promise<ScheduledJobInfo[]> {
    const scheduledJobs: ScheduledJobInfo[] = []
    const queueNames = options.queue
      ? [options.queue as keyof Queues]
      : (Object.keys(queueManager.config.queues) as (keyof Queues)[])

    for (const queueName of queueNames) {
      const queueInstance = queueManager.useQueue(queueName)
      const jobSchedulers = await queueInstance.getJobSchedulers()

      for (const scheduler of jobSchedulers) {
        scheduledJobs.push({
          key: scheduler.key,
          name: scheduler.name ?? '',
          pattern: scheduler.pattern ?? undefined,
          timezone: scheduler.tz ?? undefined,
          nextRun: new Date(scheduler.next ?? Date.now()),
          queue: String(queueName),
          endDate: scheduler.endDate ? new Date(scheduler.endDate) : undefined,
          data: scheduler.template?.data || {},
        })
      }
    }

    return scheduledJobs
  }

  /**
   * Remove a specific scheduled job by id
   */
  static async remove(id: string): Promise<boolean> {
    const queueNames = Object.keys(queueManager.config.queues) as (keyof Queues)[]

    for (const queueName of queueNames) {
      const queue = queueManager.useQueue(queueName)

      try {
        await queue.removeJobScheduler(id)
        return true
      } catch (_error) {
        continue
      }
    }

    return false
  }

  /**
   * Clear all scheduled jobs, optionally filtered by queue
   */
  static async clear({ queue }: { queue?: keyof Queues } = {}): Promise<number> {
    let removedCount = 0
    const queueNames = queue
      ? [queue]
      : (Object.keys(queueManager.config.queues) as (keyof Queues)[])

    for (const queueName of queueNames) {
      const queueInstance = queueManager.useQueue(queueName)
      const jobSchedulers = await queueInstance.getJobSchedulers()

      for (const scheduler of jobSchedulers) {
        await queueInstance.removeJobScheduler(scheduler.key)
        removedCount++
      }
    }

    return removedCount
  }

  /**
   * Get scheduled job details by key
   */
  static async find(key: string): Promise<ScheduledJobInfo | null> {
    const allJobs = await this.list()
    return allJobs.find((job) => job.key === key) || null
  }

  /**
   * Check if a job with given key is scheduled
   */
  static async exists(key: string): Promise<boolean> {
    const job = await this.find(key)
    return job !== null
  }
}
