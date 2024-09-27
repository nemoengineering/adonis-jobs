import { Job as BullJob, RateLimitError, UnrecoverableError, Worker } from 'bullmq'
import { Queues } from './types.js'
import { Logger } from '@adonisjs/core/logger'
import { Dispatcher } from './job_dispatcher.js'

export type JobConstructor<J extends Job = Job> = {
  new (): J

  defaultQueue?: keyof Queues
  encrypted?: boolean

  encrypt(data: any): Promise<string>
  decrypt(data: string): Promise<any>
}

export abstract class Job<DataType = any, ReturnType = any> {
  static defaultQueue?: keyof Queues
  static encrypted?: boolean

  data!: DataType
  job!: BullJob<DataType, ReturnType>
  worker!: Worker<DataType, ReturnType>
  logger!: Logger
  token?: string
  error?: Error

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
   * Overrides the rate limit to be active for the next jobs in the queue.
   *
   * @param waitTimeSeconds - time to wait until next try
   * @returns Worker.RateLimitError
   */
  async rateLimitQueue(waitTimeSeconds: number): Promise<RateLimitError> {
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
  fail(message?: string): never {
    throw new UnrecoverableError(message)
  }

  static dispatch<T extends Job>(this: JobConstructor<T>, data: InstanceType<typeof this>['data']) {
    return new Dispatcher(this, data)
  }

  static async encrypt<J extends Job>(this: new () => J, data: any): Promise<string> {
    const { default: encryption } = await import('@adonisjs/core/services/encryption')

    return encryption.encrypt(data)
  }

  static async decrypt<J extends Job>(this: JobConstructor<J>, data: string): Promise<any> {
    const { default: encryption } = await import('@adonisjs/core/services/encryption')

    const decrypted = encryption.decrypt<any>(data)
    if (decrypted === null) {
      throw new UnrecoverableError('Could not decrypt job payload')
    }

    return decrypted
  }

  // @internal
  async $init(
    jobClass: JobConstructor,
    job: BullJob<DataType, ReturnType>,
    token: string | undefined,
    logger: Logger
  ) {
    if (jobClass.encrypted) {
      job.data = await jobClass.decrypt(job.data as string)
    }

    this.job = job
    this.data = job.data
    this.token = token
    this.logger = logger.child({ jobName: job.name, jobId: job.id })
  }

  // @internal
  $setError(error: Error) {
    this.error = error
  }

  // @internal
  $setWorker(worker: Worker<DataType, ReturnType>) {
    this.worker = worker
  }
}
