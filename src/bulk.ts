import { JobDispatcher } from './job_dispatcher.js'
import emitter from '@adonisjs/core/services/emitter'
import queueManager from '../services/main.js'

export class Bulk {
  #jobs: JobDispatcher[]

  constructor(jobs?: JobDispatcher[]) {
    this.#jobs = jobs || []
  }

  add(job: JobDispatcher) {
    this.#jobs.push(job)
    return this
  }

  async dispatch() {
    const flow = queueManager.useFlowProducer()

    const jobs = await flow.addBulk(this.#jobs.map((job) => job.$toFlowJob()))

    void emitter.emit('job:dispatched:many', {
      jobs: jobs.map((j) => j.job),
    })

    //TODO: type returned jobs
    return jobs
  }
}
