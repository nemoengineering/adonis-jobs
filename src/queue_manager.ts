import { EmitterLike } from '@adonisjs/core/types/events'
import { Config, JobEvents, QueueConfig, Queues } from './types.js'
import { FlowProducer, Queue, QueueEvents } from 'bullmq'
import { ApplicationService } from '@adonisjs/core/types'
export class QueueManager<KnownQueues extends Record<string, QueueConfig> = Queues> {
  readonly #emitter: EmitterLike<JobEvents>

  #app: ApplicationService
  #queues: Map<keyof KnownQueues, Queue> = new Map()
  #queuesEvents: Map<keyof KnownQueues, QueueEvents> = new Map()

  constructor(
    app: ApplicationService,
    emitter: EmitterLike<JobEvents>,
    public config: Config<KnownQueues>
  ) {
    this.#app = app
    this.#emitter = emitter
  }

  useQueue<DataType, ReturnType>(queueName?: keyof KnownQueues): Queue<DataType, ReturnType> {
    if (!queueName) {
      return this.useQueue<DataType, ReturnType>(this.config.defaultQueue)
    }

    const cachedQueue = this.#queues.get(queueName)
    if (cachedQueue) {
      return cachedQueue as Queue<DataType, ReturnType>
    }

    const { globalConcurrency, ...queueOptions } = this.config.queues[queueName]

    const queue = new Queue<DataType, ReturnType>(String(queueName), {
      ...queueOptions,
      connection: this.config.connection,
    })

    this.#queues.set(queueName, queue)

    return queue
  }

  useQueueEvents<QueueName extends keyof KnownQueues>(queueName: QueueName): QueueEvents {
    const cachedQueueEvents = this.#queuesEvents.get(queueName)
    if (cachedQueueEvents) {
      return cachedQueueEvents
    }

    const { globalConcurrency, ...queueOptions } = this.config.queues[queueName]

    const queueEvents = new QueueEvents(String(queueName), {
      ...queueOptions,
      connection: this.config.connection,
    })

    this.#queuesEvents.set(queueName, queueEvents)

    return queueEvents
  }

  useFlowProducer() {
    return new FlowProducer({ connection: this.config.connection })
  }

  /*  flow() {
    return new FlowProducer<KnownJobs>(this, { connection: this.config.connection })
  }*/

  /*  getAllJobNames() {
    return Array.from(this.#jobs.keys()) as string[]
  }*/

  async shutdown() {
    for (const queue of this.#queues.values()) {
      await queue?.close()
    }
  }
}
