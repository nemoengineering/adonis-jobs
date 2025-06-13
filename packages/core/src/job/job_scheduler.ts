import type { Queues } from '../types/index.js'
import queueManager from '../../services/main.js'
import type { PrebuiltJobData } from '../types/job.js'
import type { BaseJobConstructor } from './base_job.js'
import type {
  ScheduleJobOptions,
  ScheduleJobOptionsWithPrebuilt,
  ScheduledJobInfo,
} from '../types/scheduler.js'

export class JobScheduler {
  /**
   * Extract job constructor, data, and queue name from options
   */
  static #extractJobInfo<J extends BaseJobConstructor>(
    options: ScheduleJobOptions<J> | ScheduleJobOptionsWithPrebuilt<any>,
  ) {
    const job = options.job
    const queueName = options.queue || job.defaultQueue || queueManager.config.defaultQueue

    if (this.#isPrebuiltJobData(options.job)) {
      return { jobConstructor: job.job, jobData: { ...job.data, ...options.data }, queueName }
    }

    return { jobConstructor: job, jobData: options.data, queueName }
  }

  /**
   * Check if the job parameter is a prebuilt job data object
   */
  static #isPrebuiltJobData(job: any): job is PrebuiltJobData<any> {
    return job && typeof job === 'object' && 'job' in job && 'data' in job
  }

  static async schedule<J extends BaseJobConstructor>(options: ScheduleJobOptions<J>): Promise<void>
  static async schedule<TPrebuiltJob extends PrebuiltJobData<any>>(
    options: ScheduleJobOptionsWithPrebuilt<TPrebuiltJob>,
  ): Promise<void>
  static async schedule<J extends BaseJobConstructor>(
    options: ScheduleJobOptions<J> | ScheduleJobOptionsWithPrebuilt<any>,
  ): Promise<void> {
    const { jobConstructor, jobData, queueName } = this.#extractJobInfo(options)

    const queue = queueManager.useQueue(queueName)
    await queue.upsertJobScheduler(options.key, options.repeat, {
      data: jobData,
      name: jobConstructor.jobName,
      opts: options.options,
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
