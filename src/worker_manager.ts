import { EmitterLike } from '@adonisjs/core/types/events'
import {
  Config,
  InferDataType,
  InferReturnType,
  WorkerDispatch,
  WorkerEvents,
  WorkerManagerWorkerFactory,
} from './types.js'
import { Worker } from './worker.js'
import { RuntimeException } from '@poppinss/utils'
import logger from '@adonisjs/core/services/logger'

export class WorkerManager<KnownWorkers extends Record<string, WorkerManagerWorkerFactory>> {
  //@ts-expect-error
  readonly #emitter: EmitterLike<WorkerEvents<KnownWorkers>>

  #workerCache: Partial<Record<keyof KnownWorkers, Worker>> = {}

  constructor(
    emitter: EmitterLike<WorkerEvents<KnownWorkers>>,
    public config: Config & { workers: KnownWorkers }
  ) {
    this.#emitter = emitter
  }

  use<WorkerName extends keyof KnownWorkers>(
    workerName: WorkerName
  ): WorkerDispatch<
    InferDataType<KnownWorkers[WorkerName]>,
    InferReturnType<KnownWorkers[WorkerName]>
  > {
    if (!this.config.workers[workerName]) {
      throw new RuntimeException(
        `Unknown channel "${String(workerName)}". Make sure it is configured inside the config file`
      )
    }

    const cachedWorker = this.#workerCache[workerName]
    if (cachedWorker) {
      return cachedWorker as ReturnType<KnownWorkers[WorkerName]>
    }

    const workerFactory = this.config.workers[workerName]
    const worker = workerFactory() as ReturnType<KnownWorkers[WorkerName]>

    worker.$bootQueue(workerName as string, this.config.connection)

    this.#workerCache[workerName] = worker

    return worker
  }

  async shutdown() {
    for (const [name, worker] of Object.entries(this.#workerCache)) {
      logger.debug({ name }, 'Shutting down worker')
      await worker?.$shutdownQueue()
    }
  }
}
