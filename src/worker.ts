import { ConnectionOptions, Job, Queue, QueueEvents, Worker as BullWorker } from 'bullmq'
import logger from '@adonisjs/core/services/logger'
import { JobContract, WorkerOptions } from './types.js'
import { BulkJobOptions } from 'bullmq/dist/esm/interfaces/index.js'

export abstract class Worker<DataType = any, ReturnType = any>
  implements JobContract<DataType, ReturnType>
{
  abstract readonly config: WorkerOptions

  worker!: BullWorker<DataType, ReturnType>
  queue!: Queue<DataType, ReturnType>
  queueEvents!: QueueEvents

  $bootQueue(name: string, connection: ConnectionOptions) {
    this.queue = new Queue(name, { connection })
    this.queueEvents = new QueueEvents(this.queue.name, { connection })
  }

  $boot(connection: ConnectionOptions) {
    this.worker = new BullWorker(this.queue.name, this.process, {
      connection,
      ...this.config.workerOpts,
    })

    this.worker.on('completed', () => {
      logger.info(`Completed job on queue ${this.queue.name}`)
    })

    this.worker.on('failed', (_job, error) => {
      logger.error(error, `Failed job on queue ${this.queue.name}`)
    })
  }

  async $shutdownWorker() {
    await this.worker.close()
    await this.worker.disconnect()
  }

  async $shutdownQueue() {
    await this.queue.close()
    await this.queueEvents.close()
  }

  abstract process(job: Job<DataType, ReturnType>, token?: string): Promise<ReturnType>

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
}
