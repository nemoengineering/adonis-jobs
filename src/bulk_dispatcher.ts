import { JobDispatcher } from './job_dispatcher.js'
import emitter from '@adonisjs/core/services/emitter'
import queueManager from '../services/main.js'
import { Queues } from './types.js'

export class BulkDispatcher {
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

    return jobs.map((j) => j.job)
  }

  async dispatchAndWaitResult() {
    const jobs = await this.dispatch()

    return Promise.allSettled(
      jobs.map(async (job) => {
        const queueEvents = queueManager.useQueueEvents(job.queueName as keyof Queues)
        return await job.waitUntilFinished(queueEvents)
      })
    )
  }
}
