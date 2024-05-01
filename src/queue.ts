import {
  Job as BullJob,
  Queue as BullQueue,
  QueueEvents,
  BulkJobOptions,
  ConnectionOptions,
  JobType,
} from 'bullmq'
import { QueueContract, JobEvents } from './types.js'
import { JobsOptions } from 'bullmq/dist/esm/types/index.js'
import { EmitterLike } from '@adonisjs/core/types/events'
import { Job } from './job.js'

export class Queue<KnownJobs extends Record<string, Job>, DataType = any, ReturnType = any>
  implements QueueContract<DataType, ReturnType>
{
  readonly #emitter: EmitterLike<JobEvents<KnownJobs>>
  readonly #queue: BullQueue<DataType, ReturnType>
  readonly #queueEvents: QueueEvents

  constructor(
    emitter: EmitterLike<JobEvents<KnownJobs>>,
    name: string,
    connection: ConnectionOptions
  ) {
    this.#emitter = emitter
    this.#queue = new BullQueue(name, { connection })
    this.#queueEvents = new QueueEvents(this.#queue.name, { connection })
  }

  async dispatch(
    name: string,
    data: DataType,
    options?: JobsOptions
  ): Promise<BullJob<DataType, ReturnType>> {
    const job = await this.#queue.add(name, data, options)
    void this.#emitter.emit('job:dispatched', { job })
    return job
  }

  async dispatchAndWaitResult(
    name: string,
    data: DataType,
    options?: JobsOptions
  ): Promise<ReturnType> {
    const job = await this.dispatch(name, data, options)

    return job.waitUntilFinished(this.#queueEvents)
  }

  async dispatchMany(
    jobs: { name: string; data: DataType; opts?: BulkJobOptions }[]
  ): Promise<BullJob<DataType, ReturnType>[]> {
    const jobsRes = await this.#queue.addBulk(jobs)
    void this.#emitter.emit('job:dispatched:many', { jobs: jobsRes })
    return jobsRes
  }

  async dispatchManyAndWaitResult(
    jobs: { name: string; data: DataType; opts?: BulkJobOptions }[]
  ): Promise<PromiseSettledResult<Awaited<ReturnType>>[]> {
    const queuedJobs = await this.dispatchMany(jobs)

    return Promise.allSettled(queuedJobs.map((j) => j.waitUntilFinished(this.#queueEvents)))
  }

  getQueue(): Omit<BullQueue<DataType, ReturnType>, 'add' | 'addBulk'> {
    return this.#queue
  }

  getQueueEvents(): QueueEvents {
    return this.#queueEvents
  }

  async findJobsByName(name: string, types?: JobType | JobType[]) {
    const jobs = await this.#queue.getJobs(types)
    return jobs.filter((j) => j.name === name)
  }

  async hasJobWithName(name: string, types?: JobType | JobType[]) {
    const jobs = await this.findJobsByName(name, types)
    return jobs.length > 0
  }

  async $shutdown() {
    await this.#queue.close()
    await this.#queueEvents.close()
  }
}
