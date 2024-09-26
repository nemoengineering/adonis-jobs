/*
import { FlowProducer as BullFlowProducer, FlowJob as BullFlowJob, QueueBaseOptions } from 'bullmq'
import { FlowJobArg, InferReturnType } from './types.js'
import { Job } from './job.js'
import { QueueManager } from './queue_manager.js'

export class FlowProducer<KnownJobs extends Record<string, Job>> {
  #producer: BullFlowProducer
  #jobManager: QueueManager<KnownJobs>

  constructor(jobManager: QueueManager<KnownJobs>, opts?: QueueBaseOptions) {
    this.#jobManager = jobManager
    this.#producer = new BullFlowProducer(opts)
  }

  async dispatch(flow: FlowJobArg<KnownJobs>) {
    return await this.#producer.add(flow as BullFlowJob)
  }

  async dispatchAndWaitResult(
    flow: FlowJobArg<KnownJobs>
  ): Promise<InferReturnType<KnownJobs[typeof flow.queueName]>> {
    const node = await this.dispatch(flow)

    const queueEvents = this.#jobManager.use(node.job.queueName).getQueueEvents()
    return node.job.waitUntilFinished(queueEvents)
  }

  async dispatchMany(flows: FlowJobArg<KnownJobs>[]) {
    return await this.#producer.addBulk(flows as BullFlowJob[])
  }

  async dispatchManyAndWaitResult(flows: FlowJobArg<KnownJobs>[]) {
    const nodes = await this.dispatchMany(flows)

    return Promise.allSettled(
      nodes.map((node) => {
        const queueEvents = this.#jobManager.use(node.job.queueName).getQueueEvents()

        return node.job.waitUntilFinished(queueEvents)
      })
    )
  }

  getProducer() {
    return this.#producer
  }
}
*/
