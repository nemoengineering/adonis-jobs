import { JobDispatcher } from './job_dispatcher.js'
import app from '@adonisjs/core/services/app'
import emitter from '@adonisjs/core/services/emitter'

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
    const jobs = await flow.addBulk(
      this.#jobs.map((job) => ({
        name: job.getName(),
        queueName: String(job.getQueueName()),
        data: job.getData(),
        opts: job.getJobOptions(),
      }))
    )

    void emitter.emit('job:dispatched:many', {
      jobs: jobs.map((j) => j.job),
    })

    return jobs
  }
}
