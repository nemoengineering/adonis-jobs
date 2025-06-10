import { BullMQOtel } from 'bullmq-otel'
import { trace } from '@opentelemetry/api'
import { RuntimeException } from '@poppinss/utils'
import type { ApplicationService } from '@adonisjs/core/types'
import type { EmitterLike } from '@adonisjs/core/types/events'

import { BullMqFactory } from '../bull.js'
import { JobDiscoverer } from '../job_discoverer.js'
import type { BaseJobConstructor } from '../job/base_job.js'
import type { BullWorker, Config, JobEvents, QueueConfig, Queues } from '../types/index.js'

export class WorkerManager<KnownQueues extends Record<string, QueueConfig> = Queues> {
  readonly #app: ApplicationService
  readonly #emitter: EmitterLike<JobEvents>

  readonly #jobs: Map<string, BaseJobConstructor>
  #runningWorkers: BullWorker[] = []

  constructor(
    app: ApplicationService,
    emitter: EmitterLike<JobEvents>,
    public config: Config<KnownQueues>,
    jobs: BaseJobConstructor[],
  ) {
    this.#app = app
    this.#emitter = emitter
    this.#jobs = new Map(jobs.map((j) => [j.jobName, j]))
  }

  getAllQueueNames() {
    return Object.keys(this.config.queues) as (keyof KnownQueues)[]
  }

  async startWorkers(queueNames: (keyof KnownQueues)[]) {
    this.#runningWorkers = await Promise.all(queueNames.map((w) => this.#startWorker(w)))
  }

  async stopWorkers() {
    await Promise.all(this.#runningWorkers.map((w) => w.close()))
  }

  async #startWorker(queueName: keyof KnownQueues) {
    const loggerService = await this.#app.container.make('logger')
    const logger = loggerService.child({ queueName })

    const worker = BullMqFactory.createWorker(
      String(queueName),
      async (job, token) => {
        const currentSpan = trace.getActiveSpan()
        currentSpan?.setAttribute('bullmq.job.name', job.name)
        const spanContext = currentSpan?.spanContext()

        const JobClass = this.#getJobClass(job.name)

        const jobInstance = await this.#app.container.make(JobClass)
        jobInstance.$init(
          worker,
          JobClass,
          job,
          token,
          logger.child({
            trace_id: spanContext?.traceId,
            span_id: spanContext?.spanId,
            trace_flags: spanContext?.traceFlags?.toString(),
          }),
        )

        jobInstance.logger.info('Starting job')

        const res = this.#app.container.call(jobInstance, 'process')
        void this.#emitter.emit('job:started', { job })
        return await res
      },
      {
        autorun: false,
        connection: this.config.connection,
        ...(this.config.queues[queueName]?.globalConcurrency && {
          concurrency: this.config.queues[queueName].globalConcurrency,
        }),
        ...this.config.queues[queueName].defaultWorkerOptions,
        telemetry: new BullMQOtel('adonis-jobs'),
      },
    )

    const client = await worker.client
    if (this.config.queues[queueName].globalConcurrency) {
      await client.hset(
        worker.keys.meta,
        'concurrency',
        this.config.queues[queueName].globalConcurrency,
      )
    } else {
      await client.hdel(worker.keys.meta, 'concurrency')
    }

    worker.on('failed', async (job, error, token) => {
      const spanContext = trace.getActiveSpan()?.spanContext()
      const errLogger = logger.child({
        trace_id: spanContext?.traceId,
        span_id: spanContext?.spanId,
        trace_flags: spanContext?.traceFlags?.toString(),
      })

      if (!job) {
        errLogger.error(error.message, 'Job failed')
        return
      }
      try {
        void this.#emitter.emit('job:error', { job, error })

        const JobClass = this.#getJobClass(job.name)
        const jobInstance = await this.#app.container.make(JobClass)
        jobInstance.$init(worker, JobClass, job, token, logger)
        jobInstance.$setError(error)

        await this.#app.container.call(jobInstance, 'onFailed')

        if (jobInstance.allAttemptsMade()) {
          void this.#emitter.emit('job:failed', { job, error })
        }
      } catch (e) {
        errLogger.error(e)
      }
    })

    worker.on('completed', (job) => {
      this.#emitter.emit('job:success', { job })
    })

    void worker.run()
    return worker
  }

  #getJobClass(jobName: string) {
    const JobClass = this.#jobs.get(jobName)
    if (!JobClass)
      throw new RuntimeException(
        `Unknown job "${String(jobName)}". Make sure it is configured inside the config file`,
      )
    return JobClass
  }

  static async loadJobs(app: ApplicationService): Promise<BaseJobConstructor[]> {
    const discoverer = new JobDiscoverer(app.appRoot)
    return await discoverer.discoverJobs()
  }
}
