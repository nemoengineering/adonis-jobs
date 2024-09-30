import { JobDispatcher } from './job_dispatcher.js'
import { FlowJob } from 'bullmq'
import queueManager from '../services/main.js'
import emitter from '@adonisjs/core/services/emitter'

export class Chain {
  #jobs: JobDispatcher[]

  constructor(jobs?: JobDispatcher[]) {
    this.#jobs = jobs || []
  }

  add(job: JobDispatcher) {
    this.#jobs.push(job)
    return this
  }

  async dispatch() {
    if (this.#jobs.length === 0) return

    const flowChain = this.#jobs.reduce(
      (acc, job) => job.$toFlowJob(acc ? [acc] : undefined),
      undefined as unknown as FlowJob
    )

    const flowProducer = queueManager.useFlowProducer()
    const flow = await flowProducer.add(flowChain)

    void emitter.emit('job:dispatched:chain', {
      flow,
    })

    return flow
  }
}
