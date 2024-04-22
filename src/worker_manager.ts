import { EmitterLike } from '@adonisjs/core/types/events'
import { Config, WorkerEvents, WorkerManagerWorkerFactory } from './types.js'
import { Worker } from './worker.js'
import debug from './debug.js'
import { RuntimeException } from '@poppinss/utils'

export class WorkerManager<KnownWorkers extends Record<string, WorkerManagerWorkerFactory>> {
  //@ts-expect-error
  readonly #emitter: EmitterLike<WorkerEvents<KnownWorkers>>

  #runningWorkers: Partial<Record<keyof KnownWorkers, Worker>> = {}

  constructor(
    emitter: EmitterLike<WorkerEvents<KnownWorkers>>,
    public config: Config & { workers: KnownWorkers }
  ) {
    this.#emitter = emitter
  }

  async startWorkers<Name extends keyof KnownWorkers>(workerNames: Name[]) {
    debug('Starting workers')
    for (const workerName of workerNames) {
      if (!this.config.workers[workerName]) {
        throw new RuntimeException(
          `Worker "${String(workerName)} not found. Have you registered it in "config/worker.ts"?`
        )
      }

      debug('Staring worker. name: %s', workerName)
      const workerFactory = this.config.workers[workerName]
      const worker = await workerFactory()

      worker.$bootQueue(String(workerName), this.config.connection)
      worker.$boot(this.config.connection)

      this.#runningWorkers[workerName] = worker
    }
    debug('Started workers')
  }

  getAllWorkerNames() {
    return Object.keys(this.config.workers)
  }

  async shutdown() {
    debug('Stopping workers')

    for (const [name, worker] of Object.entries(this.#runningWorkers)) {
      debug('Stopping worker. name: %s', name)
      await worker?.$shutdownWorker()
    }

    debug('Stopped workers')
  }
}
