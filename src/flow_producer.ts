import { FlowProducer as BullFlowProducer, FlowJob as BullFlowJob, QueueBaseOptions } from 'bullmq'
import { FlowJobArg } from './types.js'
import { Job } from './job.js'

export class FlowProducer<KnownJobs extends Record<string, Job>> {
  #producer: BullFlowProducer

  constructor(opts?: QueueBaseOptions) {
    this.#producer = new BullFlowProducer(opts)
  }

  async add(flow: FlowJobArg<KnownJobs>) {
    return await this.#producer.add(flow as BullFlowJob)
  }

  async addBulk(flow: FlowJobArg<KnownJobs>[]) {
    return await this.#producer.addBulk(flow as BullFlowJob[])
  }

  getProducer() {
    return this.#producer
  }
}
