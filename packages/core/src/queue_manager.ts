import { BullMQOtel } from 'bullmq-otel'
import { FlowProducer, Queue, QueueEvents } from 'bullmq'
import { RuntimeException } from '@adonisjs/core/exceptions'

import type { Config, QueueConfig, Queues } from './types/index.js'

export class QueueManager<KnownQueues extends Record<string, QueueConfig> = Queues> {
  #queues: Map<keyof KnownQueues, Queue> = new Map()
  #queuesEvents: Map<keyof KnownQueues, QueueEvents> = new Map()
  #flowProducer?: FlowProducer

  constructor(public config: Config<KnownQueues>) {}

  #getQueue(queueName: keyof KnownQueues) {
    if (!(queueName in this.config.queues)) {
      const availableQueues = Object.keys(this.config.queues).join(', ')
      throw new RuntimeException(
        `Queue "${String(queueName)}" is not defined in configuration. Available queues: ${availableQueues}`,
      )
    }

    return this.config.queues[queueName]
  }

  async #shutdownQueues() {
    for (const queue of this.#queues.values()) {
      await queue?.close()
    }
  }

  async #shutdownQueueEvents() {
    for (const queueEvents of this.#queuesEvents.values()) {
      await queueEvents?.close()
    }
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
