/*
import { FlowProducer as BullFlowProducer, FlowJob as BullFlowJob } from 'bullmq'
import { FlowJobArg, WorkerManagerWorkerFactory } from './types.js'
import { QueueBaseOptions } from 'bullmq/dist/esm/interfaces/index.js'

export class FlowProducer<KnownJobs extends Record<string, WorkerManagerWorkerFactory>> {
  #producer: BullFlowProducer

  constructor(opts?: QueueBaseOptions) {
    this.#producer = new BullFlowProducer(opts)
  }

  async add<Flow extends FlowJobArg<KnownJobs>>(flow: Flow) {
    return await this.#producer.add(flow as BullFlowJob)
  }

  async addBulk<Flow extends FlowJobArg<KnownJobs>>(flow: Flow[]) {
    return await this.#producer.addBulk(flow as BullFlowJob[])
  }

  getProducer() {
    return this.#producer
  }
}
*/
