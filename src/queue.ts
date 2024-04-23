import { Job, Queue as BullQueue, QueueEvents, BulkJobOptions, ConnectionOptions } from 'bullmq'
import { JobContract } from './types.js'

export class Queue<DataType = any, ReturnType = any> implements JobContract<DataType, ReturnType> {
  queue: BullQueue<DataType, ReturnType>
  queueEvents: QueueEvents

  constructor(name: string, connection: ConnectionOptions) {
    this.queue = new BullQueue(name, { connection })
    this.queueEvents = new QueueEvents(this.queue.name, { connection })
  }

  async dispatch(name: string, data: DataType): Promise<Job<DataType, ReturnType>> {
    return this.queue.add(name, data)
  }

  async dispatchAndWaitResult(name: string, data: DataType): Promise<ReturnType> {
    const job = await this.dispatch(name, data)

    return job.waitUntilFinished(this.queueEvents)
  }

  async dispatchMany(
    jobs: { name: string; data: DataType; opts?: BulkJobOptions }[]
  ): Promise<Job<DataType, ReturnType>[]> {
    return this.queue.addBulk(jobs)
  }

  async dispatchManyAndWaitResult(
    jobs: { name: string; data: DataType; opts?: BulkJobOptions }[]
  ): Promise<PromiseSettledResult<Awaited<ReturnType>>[]> {
    const queuedJobs = await this.dispatchMany(jobs)

    return Promise.allSettled(queuedJobs.map((j) => j.waitUntilFinished(this.queueEvents)))
  }

  async $shutdown() {
    await this.queue.close()
    await this.queueEvents.close()
  }
}
