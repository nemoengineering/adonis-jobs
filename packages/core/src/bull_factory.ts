import type { FlowProducerPro, QueueEventsPro, QueuePro, WorkerPro } from '@taskforcesh/bullmq-pro'
import type {
  Queue,
  Worker,
  QueueOptions,
  WorkerOptions,
  Processor,
  QueueEvents,
  FlowProducer,
} from 'bullmq'

import { isModuleInstalled } from './helpers.js'
import type { BullFlowProducer, BullQueue, BullQueueEvents, BullWorker } from './types/index.js'

/**
 * Factory class responsible for creating BullMQ objects based on the installed version
 * ( pro or oss )
 */
export class BullMqFactory {
  static #QueueClass: typeof Queue | typeof QueuePro
  static WorkerClass: typeof Worker | typeof WorkerPro
  static #QueueEventsClass: typeof QueueEvents | typeof QueueEventsPro
  static #FlowProducerClass: typeof FlowProducer | typeof FlowProducerPro
  static #initialized = false

  constructor(protected appRoot: string) {}

  /**
   * Must be called before creating any queues or workers.
   */
  static async init() {
    if (this.#initialized) return

    if (isModuleInstalled('@taskforcesh/bullmq-pro')) {
      const { QueuePro, WorkerPro, QueueEventsPro, FlowProducerPro } = await import(
        '@taskforcesh/bullmq-pro'
      )
      this.#QueueClass = QueuePro
      this.WorkerClass = WorkerPro
      this.#QueueEventsClass = QueueEventsPro
      this.#FlowProducerClass = FlowProducerPro
    } else {
      const { Queue, Worker, QueueEvents, FlowProducer } = await import('bullmq')
      this.#QueueClass = Queue
      this.WorkerClass = Worker
      this.#QueueEventsClass = QueueEvents
      this.#FlowProducerClass = FlowProducer
    }

    this.#initialized = true
  }

  static #ensureInitialized() {
    if (!BullMqFactory.#initialized) {
      throw new Error(
        'BullMqFactory must be initialized before creating queues or workers. Call BullMqFactory.init() first.',
      )
    }
  }

  static createQueue<A, B>(name: string, options?: QueueOptions): BullQueue<A, B> {
    this.#ensureInitialized()

    return new (this.#QueueClass as any)(name, options) as BullQueue<A, B>
  }

  static createWorker<A, B>(
    name: string,
    processor: Processor,
    options?: WorkerOptions,
  ): BullWorker<A, B> {
    this.#ensureInitialized()

    return new this.WorkerClass(name, processor as any, options) as BullWorker<A, B>
  }

  static createQueueEvents(name: string, options?: QueueOptions): BullQueueEvents {
    this.#ensureInitialized()

    return new this.#QueueEventsClass(name, options) as BullQueueEvents
  }

  static createFlowProducer(options?: QueueOptions): BullFlowProducer {
    this.#ensureInitialized()

    return new this.#FlowProducerClass(options) as BullFlowProducer
  }
}
