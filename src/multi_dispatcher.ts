import { Dispatcher } from './job_dispatcher.js'
import app from '@adonisjs/core/services/app'
import emitter from '@adonisjs/core/services/emitter'

export class MultiDispatcher {
  #jobs: Dispatcher[]

  constructor(jobs?: Dispatcher[]) {
    this.#jobs = jobs || []
  }

  add(job: Dispatcher) {
    this.#jobs.push(job)
    return this
  }

  async dispatch() {
    const manager = await app.container.make('job.queueManager')
    const flow = manager.useFlowProducer()

    const preparedJobs = await Promise.all(
      this.#jobs.map((job) => job.$toFlowJob(manager.config.defaultQueue))
    )
    const jobs = await flow.addBulk(preparedJobs)

    void emitter.emit('job:dispatched:many', {
      jobs: jobs.map((j) => j.job),
    })

    //TODO: type returned jobs
    return jobs
  }
}
