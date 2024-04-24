import { EmitterLike } from '@adonisjs/core/types/events'
import {
  Config,
  InferDataType,
  InferReturnType,
  JobContract,
  JobEvents,
  LazyWorkerImport,
} from './types.js'
import { Job } from './job.js'
import { RuntimeException } from '@poppinss/utils'
import { Queue } from './queue.js'
import debug from './debug.js'
import { Worker as BullWorker } from 'bullmq'
import { ApplicationService } from '@adonisjs/core/types'
import { FlowProducer } from './flow_producer.js'
import logger from '@adonisjs/core/services/logger'

export class JobManager<KnownJobs extends Record<string, Job>> {
  readonly #emitter: EmitterLike<JobEvents<KnownJobs>>

  #app: ApplicationService
  #jobs: Map<keyof KnownJobs, LazyWorkerImport> = new Map()
  #jobQueues: Map<keyof KnownJobs, Queue<KnownJobs>> = new Map()

  constructor(
    app: ApplicationService,
    emitter: EmitterLike<JobEvents<KnownJobs>>,
    public config: Config
  ) {
    this.#app = app
    this.#emitter = emitter
  }

  set(jobs: Record<keyof KnownJobs, LazyWorkerImport>) {
    debug('setting workers')
    this.#jobs = new Map(Object.entries(jobs))
  }

  use<Name extends keyof KnownJobs>(
    queueName: Name
  ): JobContract<InferDataType<KnownJobs[Name]>, InferReturnType<KnownJobs[Name]>> {
    if (!this.#jobs.has(queueName)) {
      throw new RuntimeException(
        `Unknown job "${String(queueName)}". Make sure it is configured inside the config file`
      )
    }

    const cachedQueue = this.#jobQueues.get(queueName)
    if (cachedQueue) {
      return cachedQueue
    }

    const queue = new Queue(this.#emitter, String(queueName), this.config.connection)
    this.#jobQueues.set(queueName, queue)

    return queue
  }

  dispatchFlow() {
    return new FlowProducer<KnownJobs>({ connection: this.config.connection })
  }

  getAllJobNames() {
    return Array.from(this.#jobs.keys()) as string[]
  }

  async startWorkers(jobNames: (keyof KnownJobs)[]) {
    return Promise.all(jobNames.map((w) => this.#startWorker(w)))
  }

  async #startWorker(name: keyof KnownJobs) {
    const { default: jobClass } = await this.#jobs.get(name)!()

    const worker = new BullWorker(
      String(name),
      async (job, token) => {
        void this.#emitter.emit('job:started', { job })

        const jobInstance = await this.#app.container.make(jobClass)
        jobInstance.$setJob(job, token)

        return this.#app.container.call(jobInstance, 'process')
      },
      {
        connection: this.config.connection,
        ...jobClass.workerOptions,
      }
    )

    worker.on('failed', async (job, error) => {
      logger.error(error.message, 'Job failed')
      if (!job) return

      void this.#emitter.emit('job:error', { job, error })
      const jobInstance = await this.#app.container.make(jobClass)
      jobInstance.$setFailed(job, error)
      return this.#app.container.call(jobInstance, 'onFailed')
    })

    worker.on('completed', (job) => {
      this.#emitter.emit('job:success', { job })
    })

    return worker
  }

  async shutdown() {
    for (const [name, queue] of this.#jobQueues.entries()) {
      console.log({ name }, 'Shutting down worker')
      await queue?.$shutdown()
    }
  }
}
