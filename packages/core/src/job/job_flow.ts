import type { FlowJob } from 'bullmq'
import emitter from '@adonisjs/core/services/emitter'

import debuglog from '../debug.js'
import type { Queues } from '../types/index.js'
import queueManager from '../../services/main.js'
import type { JobDispatcher } from './job_dispatcher.js'

class FlowBuilder {
  readonly #flow: FlowJob

  constructor(job: JobDispatcher) {
    this.#flow = job.$toFlowJob()
  }

  addChildJob(job: JobDispatcher, children?: (flow: FlowBuilder) => void) {
    const child = new FlowBuilder(job)
    children?.(child)

    if (!this.#flow.children) {
      this.#flow.children = []
    }

    this.#flow.children.push(child.#flow)

    return this
  }

  // @internal
  $build() {
    return this.#flow
  }
}

export class JobFlow extends FlowBuilder {
  async dispatch() {
    const flowProducer = queueManager.useFlowProducer()
    const preparedFlow = this.$build()
    debuglog(JSON.stringify(preparedFlow, null, 2))

    const flow = await flowProducer.add(preparedFlow)

    void emitter.emit('job:dispatched:flow', { flow })

    return flow
  }

  async dispatchAndWaitResult() {
    const flow = await this.dispatch()

    const queueEvents = queueManager.useQueueEvents(flow.job.queueName as keyof Queues)
    return await flow.job.waitUntilFinished(queueEvents)
  }
}
