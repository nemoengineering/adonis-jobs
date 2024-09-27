import { Dispatcher } from './job_dispatcher.js'
import app from '@adonisjs/core/services/app'
import { FlowJob } from 'bullmq'

export class Chain {
  #jobs: Dispatcher[]

  constructor(jobs?: Dispatcher[]) {
    this.#jobs = jobs || []
  }

  add(job: Dispatcher) {
    this.#jobs.push(job)
    return this
  }

  async dispatch() {
    if (this.#jobs.length === 0) return

    const manager = await app.container.make('job.queueManager')
    const flow = manager.useFlowProducer()

    const flowChain = await this.#jobs.reduce(
      async (acc, job) =>
        job.$toFlowJob(manager.config.defaultQueue, acc ? [await acc] : undefined),
      undefined as unknown as Promise<FlowJob>
    )

    console.log(JSON.stringify(flowChain, null, 2))

    const job = await flow.add(flowChain)

    /* void emitter.emit('job:dispatched:many', {
      jobs: jobs.map((j) => j.job),
    })*/

    return job
  }
}
