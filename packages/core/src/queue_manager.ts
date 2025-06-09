import { BullMQOtel } from 'bullmq-otel'
import { FlowProducer, Queue, QueueEvents } from 'bullmq'
import { RuntimeException } from '@adonisjs/core/exceptions'

import type { Config, QueueConfig, Queues } from './types/index.js'

export class QueueManager<KnownQueues extends Record<string, QueueConfig> = Queues> {
  #queues: Map<keyof KnownQueues, Queue> = new Map()
  #queuesEvents: Map<keyof KnownQueues, QueueEvents> = new Map()
  #flowProducer?: FlowProducer

  constructor(public config: Config<KnownQueues>) {}

  /**
   * Get a queue by its name or throw an error if the queue
   * is not defined in the configuration.
   */
  #getQueue(queueName: keyof KnownQueues) {
    if (!(queueName in this.config.queues)) {
      const availableQueues = Object.keys(this.config.queues).join(', ')
      throw new RuntimeException(
        `Queue "${String(queueName)}" is not defined in configuration. Available queues: ${availableQueues}`,
      )
    }

    return this.config.queues[queueName]
  }

  /**
   * Shutdown all queues by closing them
   */
  async #shutdownQueues() {
    const closePromises = Array.from(this.#queues.values()).map((queue) => queue?.close())
    await Promise.allSettled(closePromises)
  }

  /**
   * Shutdown all queue events by closing them
   */
  async #shutdownQueueEvents() {
    const promises = Array.from(this.#queuesEvents.values()).map((queueEvents) =>
      queueEvents?.close(),
    )

    await Promise.allSettled(promises)
  }

  useQueue<DataType = any, ReturnType = any>(
    queueName?: keyof KnownQueues,
  ): Queue<DataType, ReturnType> {
    if (!queueName) {
      return this.useQueue<DataType, ReturnType>(this.config.defaultQueue)
    }

    const cachedQueue = this.#queues.get(queueName)
    if (cachedQueue) {
      return cachedQueue as Queue<DataType, ReturnType>
    }

    const { globalConcurrency, defaultWorkerOptions, ...queueOptions } = this.#getQueue(queueName)
    const queue = new Queue<DataType, ReturnType>(String(queueName), {
      ...queueOptions,
      connection: this.config.connection,
      telemetry: new BullMQOtel('adonis-jobs'),
    })

    this.#queues.set(queueName, queue)

    return queue
  }

  useQueueEvents<QueueName extends keyof KnownQueues>(queueName: QueueName): QueueEvents {
    const cachedQueueEvents = this.#queuesEvents.get(queueName)
    if (cachedQueueEvents) {
      return cachedQueueEvents
    }

    const { globalConcurrency, defaultWorkerOptions, ...queueOptions } = this.#getQueue(queueName)
    const queueEvents = new QueueEvents(String(queueName), {
      ...queueOptions,
      connection: this.config.connection,
      telemetry: new BullMQOtel('adonis-jobs'),
    })

    this.#queuesEvents.set(queueName, queueEvents)

    return queueEvents
  }

  useFlowProducer(): FlowProducer {
    if (this.#flowProducer) return this.#flowProducer

    this.#flowProducer = new FlowProducer({
      connection: this.config.connection,
      telemetry: new BullMQOtel('adonis-jobs'),
    })

    return this.#flowProducer
  }

  async shutdown() {
    await Promise.all([
      this.#shutdownQueues(),
      this.#shutdownQueueEvents(),
      this.#flowProducer?.close(),
    ])
  }
}
