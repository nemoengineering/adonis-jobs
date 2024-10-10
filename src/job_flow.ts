import { FlowJob } from 'bullmq'
import { JobDispatcher } from './job_dispatcher.js'
import queueManager from '../services/main.js'
import emitter from '@adonisjs/core/services/emitter'

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
    const flow = await flowProducer.add(this.$build())

    void emitter.emit('job:dispatched:flow', { flow })

    return flow
  }
}
