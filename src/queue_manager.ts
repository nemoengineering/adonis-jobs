import { EmitterLike } from '@adonisjs/core/types/events'
import {
  Config,
  InferDataType,
  InferReturnType,
  JobContract,
  WorkerEvents,
  LazyWorkerImport,
} from './types.js'
import { Worker } from './worker.js'
import { RuntimeException } from '@poppinss/utils'
import { Queue } from './queue.js'
import debug from './debug.js'
import { Worker as BullWorker } from 'bullmq'
import { ApplicationService } from '@adonisjs/core/types'

export class QueueManager<KnownWorkers extends Record<string, Worker>> {
  //@ts-expect-error
  readonly #emitter: EmitterLike<WorkerEvents<KnownWorkers>>
  #app: ApplicationService
  #workers: Map<keyof KnownWorkers, LazyWorkerImport> = new Map()
  #jobQueues: Map<keyof KnownWorkers, Queue> = new Map()

  constructor(
    app: ApplicationService,
    emitter: EmitterLike<WorkerEvents<KnownWorkers>>,
    public config: Config
  ) {
    this.#app = app
    this.#emitter = emitter
  }

  set(workers: Record<keyof KnownWorkers, LazyWorkerImport>) {
    debug('setting workers')
    this.#workers = new Map(Object.entries(workers))
  }

  use<Name extends keyof KnownWorkers>(
    queueName: Name
  ): JobContract<InferDataType<KnownWorkers[Name]>, InferReturnType<KnownWorkers[Name]>> {
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

  /*  createFlow() {
    return new FlowProducer<KnownWorkers>({ connection: this.config.connection })
  }*/

  getAllWorkerNames() {
    return Object.keys(this.#workers)
  }

  async startWorkers(names: (keyof KnownWorkers)[]) {
    return Promise.all(names.map((w) => this.#startWorker(w)))
  }

  async #startWorker(name: keyof KnownWorkers) {
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
