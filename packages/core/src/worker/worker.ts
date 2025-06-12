import { BullMQOtel } from 'bullmq-otel'
import { trace } from '@opentelemetry/api'
import { RuntimeException } from '@poppinss/utils'
import type { Logger } from '@adonisjs/core/logger'
import type { ApplicationService } from '@adonisjs/core/types'
import type { EmitterLike } from '@adonisjs/core/types/events'

import { JobLogger } from './job_logger.js'
import { BullMqFactory } from '../bull_factory.js'
import type { BaseJobConstructor } from '../job/base_job.js'
import type { BullJob, BullWorker, Config, JobEvents, QueueConfig, Queues } from '../types/index.js'

export class Worker<KnownQueues extends Record<string, QueueConfig> = Queues> {
  #logger?: Logger
  #bullWorker?: BullWorker
  #app: ApplicationService
  #emitter: EmitterLike<JobEvents>
  #queueName: keyof KnownQueues
  #config: Config<KnownQueues>
  #jobs: Map<string, BaseJobConstructor>

  constructor(options: {
    app: ApplicationService
    emitter: EmitterLike<JobEvents>
    jobs: Map<string, BaseJobConstructor>
    queueName: keyof KnownQueues
    config: Config<KnownQueues>
  }) {
    this.#app = options.app
    this.#emitter = options.emitter
    this.#jobs = options.jobs
    this.#queueName = options.queueName
    this.#config = options.config
  }

  /**
   * Create a BullMQ worker instance
   */
  #createBullWorker(): BullWorker {
    const queueConfig = this.#config.queues[this.#queueName]

    return BullMqFactory.createWorker(
      String(this.#queueName),
      async (job, token) => this.#processJob(job, token),
      {
        autorun: false,
        connection: this.#config.connection,
        telemetry: new BullMQOtel('adonis-jobs'),
        ...queueConfig.defaultWorkerOptions,
        ...(queueConfig?.globalConcurrency && { concurrency: queueConfig.globalConcurrency }),
      },
    )
  }

  async #configureConcurrency(): Promise<void> {
    if (!this.#bullWorker) return

    const client = await this.#bullWorker.client
    const globalConcurrency = this.#config.queues[this.#queueName].globalConcurrency
    if (globalConcurrency) {
      await client.hset(this.#bullWorker.keys.meta, 'concurrency', globalConcurrency)
    } else {
      await client.hdel(this.#bullWorker.keys.meta, 'concurrency')
    }
  }

  /**
   * Create a JobLogger instance with the current configuration
   */
  #createJobLogger(adonisLogger: Logger, job: BullJob): JobLogger {
    const multiLoggerEnabled = this.#config.multiLogger?.enabled ?? false
    return new JobLogger({
      adonisLogger,
      bullJob: job,
      options: { logToBullMQ: multiLoggerEnabled },
    })
  }

  /**
   * Start processing a job
   */
  async #processJob(job: BullJob, token?: string) {
    const JobClass = this.#getJobClass(job.name)

    const currentSpan = trace.getActiveSpan()?.setAttribute('bullmq.job.name', job.name)
    const spanContext = currentSpan?.spanContext()
    const adonisLogger = this.#logger!.child({
      trace_id: spanContext?.traceId,
      span_id: spanContext?.spanId,
      trace_flags: spanContext?.traceFlags?.toString(),
    })

    const jobLogger = this.#createJobLogger(adonisLogger, job)

    const jobInstance = await this.#app.container.make(JobClass)
    jobInstance.$init(this.#bullWorker!, JobClass, job, token, jobLogger)

    const result = this.#app.container.call(jobInstance, 'process')
    this.#emitter.emit('job:started', { job })

    return await result
  }

  /**
   * Called when a job fails
   */
  async #onJobFailed(job: BullJob | undefined, error: Error, token: string) {
    const spanContext = trace.getActiveSpan()?.spanContext()
    const logger = this.#logger!.child({
      trace_id: spanContext?.traceId,
      span_id: spanContext?.spanId,
      trace_flags: spanContext?.traceFlags?.toString(),
    })

    if (!job) return logger.error(error.message, 'Job failed')

    this.#emitter.emit('job:error', { job, error })

    const JobClass = this.#getJobClass(job.name)
    const jobInstance = await this.#app.container.make(JobClass)

    const jobLogger = this.#createJobLogger(logger, job)

    jobInstance.$init(this.#bullWorker!, JobClass, job, token, jobLogger)
    jobInstance.$setError(error)

    await this.#app.container.call(jobInstance, 'onFailed')

    if (jobInstance.allAttemptsMade()) {
      this.#emitter.emit('job:failed', { job, error })
    }
  }

  /**
   * Called when a job is successfully completed
   */
  #onJobCompleted(job: BullJob) {
    this.#emitter.emit('job:success', { job })
  }

  #getJobClass(jobName: string) {
    const JobClass = this.#jobs.get(jobName)
    if (JobClass) return JobClass

    const message = `Job "${String(jobName)}" was not found. If you changed the job class name, make sure to use update the 'nameOverride' property.`
    throw new RuntimeException(message)
  }

  /**
   * Start the worker
   */
  async start(): Promise<BullWorker> {
    if (this.#bullWorker) throw new RuntimeException('Worker is already started')

    const loggerService = await this.#app.container.make('logger')
    this.#logger = loggerService.child({ queueName: this.#queueName })

    this.#bullWorker = this.#createBullWorker()
    await this.#configureConcurrency()

    this.#bullWorker.on('failed', this.#onJobFailed.bind(this))
    this.#bullWorker.on('completed', this.#onJobCompleted.bind(this))

    this.#bullWorker.run()
    return this.#bullWorker
  }

  async stop(force = false): Promise<void> {
    if (!this.#bullWorker) return

    await this.#bullWorker.close(force)
    this.#bullWorker = undefined
  }
}
