import type { ApplicationService } from '@adonisjs/core/types'
import type { EmitterLike } from '@adonisjs/core/types/events'

import { Worker } from './worker.js'
import type { BaseJobConstructor } from '../job/base_job.js'
import type { ConnectionResolver } from '../connection_resolver.js'
import type { Config, JobEvents, QueueConfig, Queues } from '../types/index.js'

export class WorkerManager<KnownQueues extends Record<string, QueueConfig> = Queues> {
  readonly #app: ApplicationService
  readonly #emitter: EmitterLike<JobEvents>
  readonly #jobs: Map<string, BaseJobConstructor>
  readonly #connectionResolver: ConnectionResolver
  #runningWorkers: Worker<KnownQueues>[] = []

  constructor(
    app: ApplicationService,
    emitter: EmitterLike<JobEvents>,
    public config: Config<KnownQueues>,
    jobs: BaseJobConstructor[],
    connectionResolver: ConnectionResolver,
  ) {
    this.#app = app
    this.#emitter = emitter
    this.#jobs = new Map(jobs.map((j) => [j.jobName, j]))
    this.#connectionResolver = connectionResolver
  }

  getAllQueueNames() {
    return Object.keys(this.config.queues) as (keyof KnownQueues)[]
  }

  async #startWorker(queueName: keyof KnownQueues): Promise<Worker<KnownQueues>> {
    const worker = new Worker({
      queueName,
      app: this.#app,
      jobs: this.#jobs,
      config: this.config,
      emitter: this.#emitter,
      connectionResolver: this.#connectionResolver,
    })

    worker.start()
    return worker
  }

  async startWorkers(queueNames: (keyof KnownQueues)[]) {
    this.#runningWorkers = await Promise.all(
      queueNames.map((queueName) => this.#startWorker(queueName)),
    )
  }

  async stopWorkers(force = false) {
    for (const worker of this.#runningWorkers) await worker.stop(force)
    this.#runningWorkers = []
  }
}
