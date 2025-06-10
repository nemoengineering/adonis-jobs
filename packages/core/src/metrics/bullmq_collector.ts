import { configProvider } from '@adonisjs/core'
import { Collector } from '@julr/adonisjs-prometheus/collectors/collector'
import type { CommonCollectorOptions, ResolvedPromConfig } from '@julr/adonisjs-prometheus/types'

import type { BullJob } from '../types/bull.js'
import type { QueueManager } from '../queue_manager.js'

export interface BullMQCollectorOptions {
  /**
   * Buckets for processing time histogram (in milliseconds)
   * @default [100, 500, 1000, 2500, 5000, 10000, 30000, 60000]
   */
  processingTimeBuckets?: number[]

  /**
   * Buckets for completion time histogram (in milliseconds)
   * @default [100, 500, 1000, 2500, 5000, 10000, 30000, 60000]
   */
  completionTimeBuckets?: number[]
}

/**
 * Create a BullMQ metrics collector for @julr/adonisjs-prometheus
 */
export function bullmqCollector(options: BullMQCollectorOptions = {}) {
  return configProvider.create(async (app) => {
    const queue = await app.container.make('queue.manager')
    const config = app.config.get<ResolvedPromConfig>('prometheus')

    return new BullMQCollector(queue, config, options)
  })
}

/**
 * BullMQ metrics collector that extends the base Collector class
 */
class BullMQCollector extends Collector {
  #queue: QueueManager
  #options: BullMQCollectorOptions
  #jobCountGauge!: ReturnType<Collector['createGauge']>
  #processedJobHistogram!: ReturnType<Collector['createHistogram']>
  #completedJobHistogram!: ReturnType<Collector['createHistogram']>

  constructor(
    queueManager: QueueManager,
    config: CommonCollectorOptions,
    options: BullMQCollectorOptions = {},
  ) {
    super(config)

    this.#queue = queueManager
    this.#options = options
    this.#startEventListeners()
  }

  /**
   * Start listening to queue events for completing/processing times
   */
  #startEventListeners(): void {
    const queueNames = Object.keys(this.#queue.config.queues)

    for (const queueName of queueNames) {
      const queueEvents = this.#queue.useQueueEvents(queueName as any)

      queueEvents.on('completed', async ({ jobId }: { jobId: string }) => {
        const queue = this.#queue.useQueue(queueName as any)
        const job = (await queue.getJob(jobId)) as BullJob

        if (!job || !job.processedOn || !job.finishedOn || !job.timestamp) return

        const processingTime = job.finishedOn - job.processedOn
        const completionTime = job.finishedOn - job.timestamp
        const jobName = job.name

        this.#processedJobHistogram?.observe({ queue: queueName, job: jobName }, processingTime)
        this.#completedJobHistogram?.observe({ queue: queueName, job: jobName }, completionTime)
      })
    }
  }

  /**
   * Register metrics collection
   */
  async register(): Promise<void> {
    this.#jobCountGauge = this.createGauge({
      name: 'bullmq_job_count',
      help: 'Number of jobs in the queue by state',
      labelNames: ['queue', 'state'],
      collect: () => this.#collectCountMetrics(),
    })

    this.#processedJobHistogram = this.createHistogram({
      name: 'bullmq_job_processing_time',
      help: 'Processing time for completed jobs (processing until completed)',
      buckets: this.#options.processingTimeBuckets ?? [
        100, 500, 1000, 2500, 5000, 10_000, 30_000, 60_000,
      ],
      labelNames: ['queue', 'job'],
    })

    this.#completedJobHistogram = this.createHistogram({
      name: 'bullmq_job_completion_time',
      help: 'Completion time for completed jobs (creation until completed)',
      buckets: this.#options.completionTimeBuckets ?? [
        100, 500, 1000, 2500, 5000, 10_000, 30_000, 60_000,
      ],
      labelNames: ['queue', 'job'],
    })
  }

  /**
   * Collect metrics from all queues and update gauges
   */
  async #collectCountMetrics(): Promise<void> {
    const queueNames = Object.keys(this.#queue.config.queues)
    const promises = queueNames.map(async (queueName) => {
      const queue = this.#queue.useQueue(queueName as any)
      const counts = await queue.getJobCounts()

      for (const [state, count] of Object.entries(counts)) {
        this.#jobCountGauge.set({ queue: queueName, state }, count || 0)
      }
    })

    await Promise.allSettled(promises)
  }
}
