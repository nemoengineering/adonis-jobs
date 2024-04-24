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

export class JobManager<KnownJobs extends Record<string, Job>> {
  //@ts-expect-error
  readonly #emitter: EmitterLike<JobEvents<KnownJobs>>
  #app: ApplicationService
  #workers: Map<keyof KnownJobs, LazyWorkerImport> = new Map()
  #jobQueues: Map<keyof KnownJobs, Queue> = new Map()

  constructor(
    app: ApplicationService,
    emitter: EmitterLike<JobEvents<KnownJobs>>,
    public config: Config
  ) {
    this.#app = app
    this.#emitter = emitter
  }

  set(workers: Record<keyof KnownJobs, LazyWorkerImport>) {
    debug('setting workers')
    this.#workers = new Map(Object.entries(workers))
  }

  use<Name extends keyof KnownJobs>(
    queueName: Name
  ): JobContract<InferDataType<KnownJobs[Name]>, InferReturnType<KnownJobs[Name]>> {
    if (!this.#workers.has(queueName)) {
      throw new RuntimeException(
        `Unknown job "${String(queueName)}". Make sure it is configured inside the config file`
      )
    }

    const cachedQueue = this.#jobQueues.get(queueName)
    if (cachedQueue) {
      return cachedQueue
    }

    const queue = new Queue(String(queueName), this.config.connection)
    this.#jobQueues.set(queueName, queue)

    return queue
  }

  dispatchFlow() {
    return new FlowProducer<KnownJobs>({ connection: this.config.connection })
  }

  getAllWorkerNames() {
    return Array.from(this.#workers.keys()) as string[]
  }

  async startWorkers(names: (keyof KnownJobs)[]) {
    return Promise.all(names.map((w) => this.#startWorker(w)))
  }

  async #startWorker(name: keyof KnownJobs) {
    const { default: jobClass } = await this.#workers.get(name)!()

    const worker = new BullWorker(
      String(name),
      async (job, token) => {
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
      console.log('Job failed with', error.message)
      if (!job) return

      const jobInstance = await this.#app.container.make(jobClass)
      jobInstance.$setFailed(job, error)
      return this.#app.container.call(jobInstance, 'onFailed')
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
