import { BullMQOtel } from 'bullmq-otel'
import type { Logger } from '@adonisjs/core/logger'
import { RuntimeException } from '@adonisjs/core/exceptions'

import { BullMqFactory } from './bull_factory.js'
import { JobDiscoverer } from './worker/job_discoverer.js'
import type { ConnectionResolver } from './connection_resolver.js'
import type {
  BullFlowProducer,
  BullQueue,
  BullQueueEvents,
  Config,
  JobState,
  QueueConfig,
  Queues,
} from './types/index.js'

export class QueueManager<KnownQueues extends Record<string, QueueConfig> = Queues> {
  #flowProducer?: BullFlowProducer
  #queues: Map<keyof KnownQueues, BullQueue> = new Map()
  #queuesEvents: Map<keyof KnownQueues, BullQueueEvents> = new Map()
  #jobDiscoverer: JobDiscoverer

  constructor(
    appRoot: URL,
    public config: Config<KnownQueues>,
    private connectionResolver: ConnectionResolver,
    private logger: Logger,
  ) {
    this.#jobDiscoverer = new JobDiscoverer(appRoot)
  }

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
  ): BullQueue<DataType, ReturnType> {
    if (!queueName) return this.useQueue(this.config.defaultQueue)

    const cachedQueue = this.#queues.get(queueName)
    if (cachedQueue) return cachedQueue as BullQueue<DataType, ReturnType>

    const { globalConcurrency, defaultWorkerOptions, connection, ...queueOptions } =
      this.#getQueue(queueName)

    const queue = BullMqFactory.createQueue<DataType, ReturnType>(String(queueName), {
      ...queueOptions,
      connection: this.connectionResolver.resolve(connection),
      telemetry: new BullMQOtel('adonis-jobs'),
    })

    queue.on('error', (err) => {
      this.logger.child({ queueName }).error(err, 'Queue error')
    })

    this.#queues.set(queueName, queue)

    return queue
  }

  useQueueEvents<QueueName extends keyof KnownQueues>(queueName: QueueName): BullQueueEvents {
    const cachedQueueEvents = this.#queuesEvents.get(queueName)
    if (cachedQueueEvents) return cachedQueueEvents

    const { globalConcurrency, defaultWorkerOptions, connection, ...queueOptions } =
      this.#getQueue(queueName)

    const queueEvents = BullMqFactory.createQueueEvents(String(queueName), {
      ...queueOptions,
      connection: this.connectionResolver.resolve(connection),
      telemetry: new BullMQOtel('adonis-jobs'),
    })

    this.#queuesEvents.set(queueName, queueEvents)
    return queueEvents
  }

  useFlowProducer(): BullFlowProducer {
    if (this.#flowProducer) return this.#flowProducer

    this.#flowProducer = BullMqFactory.createFlowProducer({
      connection: this.connectionResolver.resolve(this.config.connection),
      telemetry: new BullMQOtel('adonis-jobs'),
    })

    return this.#flowProducer
  }

  /**
   * Completely destroys the queue and all of its contents irreversibly.
   * This operation requires to iterate on all the jobs stored in the queue
   * and can be slow for very large queues.
   */
  async clear(queueNames?: Array<keyof KnownQueues>) {
    const queues = queueNames ?? (Object.keys(this.config.queues) as (keyof KnownQueues)[])

    const promises = queues.map(async (name) => {
      const queue = this.useQueue(name)
      await queue.obliterate({ force: true })
    })

    return await Promise.all(promises)
  }

  /**
   * Drains the queue, i.e., removes all jobs that are waiting or delayed, but not active, completed or failed.
   */
  async drain(queueNames?: Array<keyof KnownQueues>, options?: { cleanDelayed?: boolean }) {
    const queues = queueNames ?? (Object.keys(this.config.queues) as (keyof KnownQueues)[])

    const promises = queues.map(async (name) => {
      const queue = this.useQueue(name)
      await queue.drain(options?.cleanDelayed ?? true)
    })

    return await Promise.all(promises)
  }

  /**
   * Cleans jobs of a specific type and older than a specified grace period.
   */
  async clean(
    queueNames?: Array<keyof KnownQueues>,
    options?: { grace: number; limit: number; type?: JobState },
  ) {
    const queues = queueNames ?? (Object.keys(this.config.queues) as (keyof KnownQueues)[])
    const { grace = 0, limit = 100, type = 'completed' } = options ?? {}

    const promises = queues.map(async (name) => {
      const queue = await this.useQueue(name)

      const deletedJobIds = await queue.clean(grace, limit, type)
      return { queue: name, count: deletedJobIds.length }
    })

    return await Promise.all(promises)
  }

  async getAvailableJobs() {
    const jobs = await this.#jobDiscoverer.discoverAndLoadJobs()
    return jobs
  }

  async shutdown() {
    await Promise.all([
      this.#shutdownQueues(),
      this.#shutdownQueueEvents(),
      this.#flowProducer?.close(),
    ])
  }
}
