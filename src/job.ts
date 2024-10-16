import { Job as BullJob, RateLimitError, UnrecoverableError, Worker } from 'bullmq'
import { InferDataType, InferReturnType, Queues } from './types.js'
import { Logger } from '@adonisjs/core/logger'
import { JobDispatcher } from './job_dispatcher.js'
import encryption from '@adonisjs/core/services/encryption'

export type JobConstructor<JobInstance extends Job<any, any> = Job<any, any>> = {
  new (...args: any[]): JobInstance

  nameOverride?: string
  defaultQueue?: keyof Queues
  encrypted?: boolean
  jobName: string

  dispatch<J extends JobInstance>(
    this: JobConstructor<J>,
    data: InferDataType<J>
  ): JobDispatcher<JobConstructor<J>, InferDataType<J>>
  isInstanceOf<J extends JobInstance>(
    this: JobConstructor<J>,
    job: BullJob<any, any>
  ): job is BullJob<InferDataType<J>, InferReturnType<J>>

  encrypt<J extends JobInstance>(this: JobConstructor<J>, data: any): string
  decrypt<J extends JobInstance>(this: JobConstructor<J>, data: string): any
}

export abstract class Job<DataType, ReturnType> {
  /**
   * Define a custom job name. Defaults to the job class name.
   */
  static nameOverride?: string

  /**
   * Define a default queue for this job. Defaults to the default queue defined inn config/queue.ts
   */
  static defaultQueue?: keyof Queues

  /**
   * Encrypt job data sent to workers
   */
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

  static dispatch<J extends Job<any, any>>(this: JobConstructor<J>, data: InferDataType<J>) {
    return new JobDispatcher(this, data)
  }

  static isInstanceOf<J extends Job<any, any>>(
    this: JobConstructor<J>,
    job: BullJob<any, any>
  ): job is BullJob<InferDataType<J>, InferReturnType<J>> {
    return job.name === this.jobName
  }

  static encrypt<J extends Job<any, any>>(this: JobConstructor<J>, data: any): string {
    return encryption.encrypt(data)
  }

  static decrypt<J extends Job<any, any>>(this: JobConstructor<J>, data: string): any {
    const decrypted = encryption.decrypt<any>(data)
    if (decrypted === null) {
      throw new UnrecoverableError('Could not decrypt job payload')
    }

    return decrypted
  }

  static get jobName() {
    return this.nameOverride || this.name
  }

  // @internal
  $init(
    worker: Worker<DataType, ReturnType>,
    jobClass: JobConstructor,
    job: BullJob<DataType, ReturnType>,
    token: string | undefined,
    logger: Logger
  ) {
    if (jobClass.encrypted) {
      job.data = jobClass.decrypt(job.data as string)
    }

    this.worker = worker
    this.job = job
    this.data = job.data
    this.token = token
    this.logger = logger.child({ jobName: job.name, jobId: job.id })
  }

  // @internal
  $setError(error: Error) {
    this.error = error
  }
}
