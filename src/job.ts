import { Job as BullJob, RateLimitError, UnrecoverableError, Worker } from 'bullmq'
import { JobConstructor, Queues } from './types.js'
//import logger from '@adonisjs/core/services/logger'
import { Logger } from '@adonisjs/core/logger'
import app from '@adonisjs/core/services/app'
import { JobDispatcher } from './job_dispatcher.js'

export abstract class Job<DataType = any, ReturnType = any> {
  static defaultQueue?: keyof Queues

  data!: DataType
  job!: BullJob<DataType, ReturnType>
  worker!: Worker<DataType, ReturnType>
  logger!: Logger
  token?: string
  error?: Error

  $setJob(job: BullJob<DataType, ReturnType>, token?: string) {
    this.job = job
    this.data = job.data
    this.token = token
    //this.logger = logger.child({ queueName: job.queueName, jobName: job.name, jobId: job.id })
  }

  $setError(error: Error) {
    this.error = error
  }

  $setWorker(worker: Worker<DataType, ReturnType>) {
    this.worker = worker
  }

  abstract process(...args: any[]): Promise<ReturnType>

  async onFailed(..._args: any[]): Promise<void> {
    this.logger.error(this.error)
  }

  /**
   * Returns true if all attempts have been made according to the config at dispatch
   */
  allAttemptsMade(): boolean {
    return this.job.attemptsMade === this.job.opts.attempts || this.job.finishedOn !== undefined
  }

  /**
   * Overrides the rate limit to be active for the next jobs.
   *
   * @param waitTimeSeconds - time to wait until next try
   * @returns Worker.RateLimitError
   */
  async rateLimit(waitTimeSeconds: number): Promise<RateLimitError> {
    await this.worker.rateLimit(waitTimeSeconds * 1000)
    return Worker.RateLimitError()
  }

  /**
   * Error to move a job to failed even if the attemptsMade
   * are lower than the expected limit.
   *
   * @param message
   * @throws UnrecoverableError
   */
  failWithoutRetry(message?: string): never {
    throw new UnrecoverableError(message)
  }

  static dispatch<T extends Job>(this: JobConstructor<T>, data: InstanceType<typeof this>['data']) {
    return new JobDispatcher(data, async ({ queueName, jobOptions }) => {
      const manager = await app.container.make('job.queueManager')
      const queue = manager.useQueue<
        InstanceType<typeof this>['data'],
        InstanceType<typeof this>['job']['returnvalue']
      >(queueName || this.defaultQueue)

      const job = await queue.add(this.name, data, jobOptions)
      //void this.#emitter.emit('job:dispatched', { jobName: queue.name, job })
      return job
    })
  }

  static dispatchAndWait<T extends Job>(
    this: JobConstructor<T>,
    data: InstanceType<typeof this>['data']
  ) {
    return new JobDispatcher(data, async ({ queueName, jobOptions }) => {
      const manager = await app.container.make('job.queueManager')
      const queue = manager.useQueue<
        InstanceType<typeof this>['data'],
        InstanceType<typeof this>['job']['returnvalue']
      >(queueName || this.defaultQueue)

      const job = await queue.add(this.name, data, jobOptions)
      const queueEvents = manager.useQueueEvents(queue.name as keyof Queues)

      //void this.#emitter.emit('job:dispatched', { jobName: queue.name, job })
      return job.waitUntilFinished(queueEvents)
    })
  }
}
