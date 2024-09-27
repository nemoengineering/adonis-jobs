import { Config, QueueConfig, Queues } from './types.js'
import { FlowProducer, Queue, QueueEvents } from 'bullmq'

export class QueueManager<KnownQueues extends Record<string, QueueConfig> = Queues> {
  #queues: Map<keyof KnownQueues, Queue> = new Map()
  #queuesEvents: Map<keyof KnownQueues, QueueEvents> = new Map()
  #flowProducer?: FlowProducer

  constructor(public config: Config<KnownQueues>) {}

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

    const { globalConcurrency, defaultWorkerOptions, ...queueOptions } =
      this.config.queues[queueName]

    const queueEvents = new QueueEvents(String(queueName), {
      ...queueOptions,
      connection: this.config.connection,
    })

    this.#queuesEvents.set(queueName, queueEvents)

    return queueEvents
  }

  useFlowProducer(): FlowProducer {
    if (this.#flowProducer) return this.#flowProducer

    this.#flowProducer = new FlowProducer({ connection: this.config.connection })

    return this.#flowProducer
  }

  async shutdown() {
    for (const queue of this.#queues.values()) {
      await queue?.close()
    }
    await this.#flowProducer?.close()
  }
}
