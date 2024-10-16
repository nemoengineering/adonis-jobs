import { JobDispatcher } from './job_dispatcher.js'
import { FlowJob } from 'bullmq'
import queueManager from '../services/main.js'
import emitter from '@adonisjs/core/services/emitter'
import { Queues } from './types.js'
import debuglog from './debug.js'

export class JobChain {
  #jobs: JobDispatcher[]

  constructor(jobs?: JobDispatcher[]) {
    this.#jobs = jobs || []
  }

  add(job: JobDispatcher) {
    this.#jobs.push(job)
    return this
  }

  addMany(jobs: JobDispatcher[]) {
    this.#jobs.push(...jobs)
    return this
  }

  async dispatch() {
    if (this.#jobs.length === 0) return

    const flowChain = this.#jobs.reduce(
      (acc, job) => job.$toFlowJob(acc ? [acc] : undefined),
      undefined as unknown as FlowJob
    )

    debuglog(JSON.stringify(flowChain, null, 2))

    const flowProducer = queueManager.useFlowProducer()
    const flow = await flowProducer.add(flowChain)

    void emitter.emit('job:dispatched:chain', {
      flow,
    })

    return flow
  }

  async dispatchAndWaitResult() {
    const flow = await this.dispatch()
    if (!flow) return

    const queueEvents = queueManager.useQueueEvents(flow.job.queueName as keyof Queues)
    return await flow.job.waitUntilFinished(queueEvents)
  }
}
