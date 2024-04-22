import { EmitterLike } from '@adonisjs/core/types/events'
import {
  Config,
  InferDataType,
  InferReturnType,
  JobContract,
  WorkerEvents,
  WorkerManagerWorkerFactory,
} from './types.js'
import { Worker } from './worker.js'
import { RuntimeException } from '@poppinss/utils'
import logger from '@adonisjs/core/services/logger'

export class QueueManager<KnownWorkers extends Record<string, WorkerManagerWorkerFactory>> {
  //@ts-expect-error
  readonly #emitter: EmitterLike<WorkerEvents<KnownWorkers>>

  #workerCache: Partial<Record<keyof KnownWorkers, Worker>> = {}

  constructor(
    emitter: EmitterLike<WorkerEvents<KnownWorkers>>,
    public config: Config & { workers: KnownWorkers }
  ) {
    this.#emitter = emitter
  }

  async use<Name extends keyof KnownWorkers>(
    queueName: Name
  ): Promise<JobContract<InferDataType<KnownWorkers[Name]>, InferReturnType<KnownWorkers[Name]>>> {
    if (!this.config.workers[queueName]) {
      throw new RuntimeException(
        `Unknown channel "${String(queueName)}". Make sure it is configured inside the config file`
      )
    }

    const cachedWorker = this.#workerCache[queueName]
    if (cachedWorker) {
      return cachedWorker as Awaited<ReturnType<KnownWorkers[Name]>>
    }

    const workerFactory = this.config.workers[queueName]
    const worker = (await workerFactory()) as Awaited<ReturnType<KnownWorkers[Name]>>

    worker.$bootQueue(String(queueName), this.config.connection)

    this.#workerCache[queueName] = worker

    return worker
  }

  async shutdown() {
    for (const [name, worker] of Object.entries(this.#workerCache)) {
      logger.debug({ name }, 'Shutting down worker')
      await worker?.$shutdownQueue()
    }
  }
}
