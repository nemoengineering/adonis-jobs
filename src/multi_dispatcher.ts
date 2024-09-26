import { JobDispatcher } from './job_dispatcher.js'
import app from '@adonisjs/core/services/app'

export class MultiDispatcher {
  #jobs: JobDispatcher[]

  constructor(...jobs: JobDispatcher[]) {
    this.#jobs = jobs || []
  }

  add(job: JobDispatcher) {
    this.#jobs.push(job)
    return this
  }

  async dispatch() {
    const manager = await app.container.make('job.queueManager')
    const flow = manager.useFlowProducer()

    //TODO: type returned jobs
    return await flow.addBulk(
      this.#jobs.map((job) => ({
        name: job.getName(),
        queueName: String(job.getConfig().queueName),
        data: job.getData(),
        opts: job.getConfig().jobOptions,
      }))
    )
  }
}
