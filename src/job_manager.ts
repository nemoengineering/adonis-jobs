import { EmitterLike } from '@adonisjs/core/types/events'
import {
  Config,
  InferDataType,
  InferReturnType,
  JobEvents,
  LazyWorkerImport,
  QueueConfig,
  JobConstructor,
} from './types.js'
import { Job } from './job.js'
import { RuntimeException } from '@poppinss/utils'
import debug from './debug.js'
import { Worker as BullWorker, Queue, QueueEvents } from 'bullmq'
import { ApplicationService } from '@adonisjs/core/types'
import { FlowProducer } from './flow_producer.js'
import logger from '@adonisjs/core/services/logger'
import { JobsOptions, Job as BullJob } from 'bullmq'
import { Dispatcher } from './dispatcher.js'

export class JobManager<
  KnownQueues extends Record<string, QueueConfig>,
  KnownJobs extends Record<string, Job>,
> {
  readonly #emitter: EmitterLike<JobEvents<KnownJobs>>

  #app: ApplicationService
  #jobs: Map<keyof KnownJobs, LazyWorkerImport> = new Map()
  #jobClassCache: Map<keyof KnownJobs, JobConstructor> = new Map()
  #queues: Map<keyof KnownQueues, Queue> = new Map()
  #queuesEvents: Map<keyof KnownQueues, QueueEvents> = new Map()

  constructor(
    app: ApplicationService,
    emitter: EmitterLike<JobEvents<KnownJobs>>,
    public config: Config<KnownQueues>
  ) {
    this.#app = app
    this.#emitter = emitter
  }

  set(jobs: Record<keyof KnownJobs, LazyWorkerImport>) {
    debug('setting workers')
    this.#jobs = new Map(Object.entries(jobs))
  }

  async #getJobClass(jobName: keyof KnownJobs) {
    const cachedJobClass = this.#jobClassCache.get(jobName)
    if (cachedJobClass) return cachedJobClass

    const jobImport = this.#jobs.get(jobName)
    if (!jobImport) {
      throw new RuntimeException(
        `Unknown job "${String(jobName)}". Make sure it is configured inside the config file`
      )
    }

    const { default: jobClass } = await jobImport()
    this.#jobClassCache.set(jobName, jobClass)

    return jobClass
  }

  dispatch<JobName extends keyof KnownJobs>(
    jobName: JobName & string,
    data: InferDataType<KnownJobs[JobName]>,
    options?: JobsOptions
  ) {
    return new Dispatcher<
      KnownQueues,
      BullJob<
        InferDataType<KnownJobs[JobName]>,
        InferReturnType<KnownJobs[JobName]>,
        JobName & string
      >
    >(async (d) => {
      const JobClass = await this.#getJobClass(jobName)
      const queue = this.#useQueue<JobName, any>(
        d.queueName || JobClass.defaultQueue || this.config.defaultQueue
      )

      const job = await queue.add(jobName, data, options)
      void this.#emitter.emit('job:dispatched', { jobName: queue.name, job })
      return job
    })
  }

  dispatchAndWaitResult<JobName extends keyof KnownJobs>(
    jobName: JobName,
    data: InferDataType<KnownJobs[JobName]>,
    options?: JobsOptions
  ) {
    return new Dispatcher<KnownQueues, InferReturnType<KnownJobs[keyof KnownJobs]>>(async (d) => {
      const JobClass = await this.#getJobClass(jobName)
      const queue = this.#useQueue(d.queueName || JobClass.defaultQueue || this.config.defaultQueue)

      const job = await queue.add(String(jobName), data, options)
      const queueEvents = this.#useQueueEvents(job.queueName)

      void this.#emitter.emit('job:dispatched', { jobName: queue.name, job })
      return job.waitUntilFinished(queueEvents)
    })
  }

  #useQueue<JobName extends keyof KnownJobs, QueueName extends keyof KnownQueues>(
    queueName: QueueName
  ): Queue<
    InferDataType<KnownJobs[JobName]>,
    InferReturnType<KnownJobs[JobName]>,
    JobName & string
  > {
    const cachedQueue = this.#queues.get(queueName)
    if (cachedQueue) {
      return cachedQueue as Queue<any, any, JobName & string>
    }

    const { globalConcurrency, ...queueOptions } = this.config.queues[queueName]

    const queue = new Queue<
      InferDataType<KnownJobs[JobName]>,
      InferReturnType<KnownJobs[JobName]>,
      JobName & string
    >(String(queueName), {
      ...queueOptions,
      connection: this.config.connection,
    })

    this.#queues.set(queueName, queue)

    return queue
  }

  #useQueueEvents<QueueName extends keyof KnownQueues>(queueName: QueueName): QueueEvents {
    const cachedQueueEvents = this.#queuesEvents.get(queueName)
    if (cachedQueueEvents) {
      return cachedQueueEvents
    }

    const { globalConcurrency, ...queueOptions } = this.config.queues[queueName]

    const queueEvents = new QueueEvents(String(queueName), {
      ...queueOptions,
      connection: this.config.connection,
    })

    this.#queuesEvents.set(queueName, queueEvents)

    return queueEvents
  }

  flow() {
    return new FlowProducer<KnownJobs>(this, { connection: this.config.connection })
  }

  getAllJobNames() {
    return Array.from(this.#jobs.keys()) as string[]
  }

  async startWorkers(queueNames: (keyof KnownQueues)[]) {
    return Promise.all(queueNames.map((w) => this.#startWorker(w)))
  }

  async #startWorker<QueueName extends keyof KnownQueues>(queueName: QueueName) {
    const worker = new BullWorker<any, any, keyof KnownJobs & string>(
      String(queueName),
      async (job, token) => {
        const JobClass = await this.#getJobClass(job.name)
        void this.#emitter.emit('job:started', { jobName: job.name, job })

        const jobInstance = await this.#app.container.make(JobClass)
        jobInstance.$setJob(job, token)
        jobInstance.$setWorker(worker)

        jobInstance.logger.info('Starting job')
        return await this.#app.container.call(jobInstance, 'process')
      }
    )

    worker.on('failed', async (job, error) => {
      if (!job) {
        logger.error(error.message, 'Job failed')
        return
      }
      void this.#emitter.emit('job:error', { jobName: job.name, job, error })

      const JobClass = await this.#getJobClass(job.name)
      const jobInstance = await this.#app.container.make(JobClass)
      jobInstance.$setJob(job)
      jobInstance.$setError(error)

      try {
        await this.#app.container.call(jobInstance, 'onFailed')
      } catch (e) {
        logger.error(e)
      }

      if (jobInstance.allAttemptsMade()) {
        void this.#emitter.emit('job:failed', { jobName: job.name, job, error })
      }
    })

    worker.on('completed', (job) => {
      this.#emitter.emit('job:success', { jobName: job.name, job })
    })

    return worker
  }

  async shutdown() {
    for (const queue of this.#queues.values()) {
      await queue?.close()
    }
  }
}
