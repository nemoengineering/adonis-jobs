import { DispatchConfig } from './job_dispatcher.js'
import { Queues } from './types.js'
import app from '@adonisjs/core/services/app'

export class MultiDispatcher {
  #jobs: DispatchConfig<Queues>[]

  constructor(jobs: DispatchConfig<Queues>[]) {
    this.#jobs = jobs
  }

  async dispatch() {
    const manager = await app.container.make('job.queueManager')
    const flow = manager.useFlowProducer()

    const jobs = await flow.addBulk(this.#jobs.map((job) => ({})))
  }
}
