import { configProvider } from '@adonisjs/core'
import { Collector } from '@julr/adonisjs-prometheus/collectors/collector'
import type { CommonCollectorOptions, ResolvedPromConfig } from '@julr/adonisjs-prometheus/types'

import type { QueueManager } from '../worker_manager/queue_manager.js'

/**
 * Create a BullMQ metrics collector for @julr/adonisjs-prometheus
 */
export function bullmqCollector() {
  return configProvider.create(async (app) => {
    const queueManager = await app.container.make('job.queueManager')
    const config = app.config.get<ResolvedPromConfig>('prometheus')

    return new BullMQCollector(queueManager, config)
  })
}

/**
 * BullMQ metrics collector that extends the base Collector class
 */
class BullMQCollector extends Collector {
  #queueManager: QueueManager
  #jobCountGauge!: ReturnType<Collector['createGauge']>

  constructor(queueManager: QueueManager, options: CommonCollectorOptions) {
    super(options)

    this.#queueManager = queueManager
  }

  /**
   * Register metrics collection
   */
  async register(): Promise<void> {
    this.#jobCountGauge = this.createGauge({
      name: 'bullmq_job_count',
      help: 'Number of jobs in the queue by state',
      labelNames: ['queue', 'state'],
      collect: () => this.#collectMetrics(),
    })
  }

  /**
   * Collect metrics from all queues and update gauges
   */
  async #collectMetrics(): Promise<void> {
    const queueNames = Object.keys(this.#queueManager.config.queues)
    const promises = queueNames.map(async (queueName) => {
      const queue = this.#queueManager.useQueue(queueName as any)
      const counts = await queue.getJobCounts()

      for (const [state, count] of Object.entries(counts)) {
        this.#jobCountGauge.set({ queue: queueName, state }, count || 0)
      }
    })

    await Promise.allSettled(promises)
  }
}
