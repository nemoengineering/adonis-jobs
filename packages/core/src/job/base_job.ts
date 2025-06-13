import { UnrecoverableError } from 'bullmq'
import type { RateLimitError } from 'bullmq'
import type { Logger } from '@adonisjs/core/logger'
import encryption from '@adonisjs/core/services/encryption'

import { BullMqFactory } from '../bull_factory.js'
import type {
  BullJob,
  BullWorker,
  InferDataType,
  InferReturnType,
  Queues,
  BullJobsOptions,
} from '../types/index.js'

export type BaseJobConstructor<JobInstance extends BaseJob<any, any> = BaseJob<any, any>> = {
  new (...args: any[]): JobInstance

  nameOverride?: string
  defaultQueue?: keyof Queues
  encrypted?: boolean
  options?: BullJobsOptions
  jobName: string

  isInstanceOf<J extends JobInstance>(
    this: BaseJobConstructor<J>,
    job: BullJob<any, any>,
  ): job is BullJob<InferDataType<J>, InferReturnType<J>>

  encrypt<J extends JobInstance>(this: BaseJobConstructor<J>, data: any): string
  decrypt<J extends JobInstance>(this: BaseJobConstructor<J>, data: string): any
}

export abstract class BaseJob<DataType, ReturnType> {
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

  /**
   * Default options for this job. These options will be applied to all instances
   * of this job unless overridden during dispatch.
   */
  static options?: BullJobsOptions

  data!: DataType
  job!: BullJob<DataType, ReturnType>
  worker!: BullWorker<DataType, ReturnType>
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

    // eslint-disable-next-line unicorn/throw-new-error
    return BullMqFactory.WorkerClass.RateLimitError()
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

  /**
   * Check if the given job is an instance of the current job class.
   */
  static isInstanceOf<J extends BaseJob<any, any>>(
    this: BaseJobConstructor<J>,
    job: BullJob<any, any>,
  ): job is BullJob<InferDataType<J>, InferReturnType<J>> {
    return job.name === this.jobName
  }

  static encrypt<J extends BaseJob<any, any>>(this: BaseJobConstructor<J>, data: any): string {
    return encryption.encrypt(data)
  }

  static decrypt<J extends BaseJob<any, any>>(this: BaseJobConstructor<J>, data: string): any {
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
    worker: BullWorker<DataType, ReturnType>,
    jobClass: BaseJobConstructor,
    job: BullJob<DataType, ReturnType>,
    token: string | undefined,
    logger: Logger,
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
