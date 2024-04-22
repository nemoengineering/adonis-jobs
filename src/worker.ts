import { ConnectionOptions, Job, Queue, QueueEvents, Worker as BullWorker } from 'bullmq'
import logger from '@adonisjs/core/services/logger'
import { JobContract, WorkerOptions } from './types.js'

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
    return await this.queue.add(name, data)
  }

  async dispatchAndWaitResult(name: string, data: DataType): Promise<ReturnType> {
    const job = await this.dispatch(name, data)

    return job.waitUntilFinished(this.queueEvents)
  }
}
