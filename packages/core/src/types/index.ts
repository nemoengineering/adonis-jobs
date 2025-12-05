import type { Attributes } from '@opentelemetry/api'
import type { ConfigProvider } from '@adonisjs/core/types'
import type { RedisClusterConnection } from '@adonisjs/redis'
import type { RedisConnections } from '@adonisjs/redis/types'

import type { BaseJob } from '../job/base_job.js'
import type { QueueManager } from '../queue_manager.js'
import type { BullQueueOptions, BullWorkerOptions } from './bull.js'

export * from './scheduler.js'
export * from './events.js'
export * from './bull.js'
export * from './job.js'
export type { JobConstructor } from '../job/job.js'

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  enabled: boolean
  endpoint?: string
  /**
   * Port for the health check server. Defaults to 3333.
   * Can also be set via QUEUE_PORT or PORT environment variables.
   */
  port?: number
  checks?: (context: { connection: RedisClusterConnection }) => any[]
}

/**
 * Metrics configuration for workers. @julr/adonisjs-prometheus needs to be installed
 * to use this feature.
 */
export interface MetricsConfig {
  /**
   * If enabled, each worker will expose a metrics endpoint that can be scraped by Prometheus.
   */
  enabled: boolean

  /**
   * Endpoint for the metrics. If not set, defaults to `prometheus.endpoint` config
   */
  endpoint?: string
}

/**
 * OpenTelemetry configuration
 */
export interface OtelConfig {
  /**
   * Additional default attributes for the span created within each job.
   * Internally, we already add an attribute `bullmq.job.name` with the job name.
   */
  defaultJobAttributes?: (job: BaseJob<any, any>) => Attributes
}

export interface QueueService extends QueueManager {}

/**
 * Connection configuration types
 */
export interface QueueConnectionConfig {
  connectionName: keyof RedisConnections
}

export interface Config<
  KnownQueues extends Record<string, QueueConfig> = Record<string, QueueConfig>,
> {
  connection: QueueConnectionConfig
  useSharedConnection?: boolean
  defaultQueue: keyof KnownQueues
  defaultPrefix?: string
  queues: KnownQueues
  healthCheck?: HealthCheckConfig
  metrics?: MetricsConfig
  otel?: OtelConfig

  /**
   * Multi logger allows you to use the AdonisJS logger as usual within your jobs,
   * but logs will be sent to both your configured Pino destinations (console, files, etc.)
   * AND to the BullMQ job logs (visible in the queue dashboard).
   */
  multiLogger?: { enabled?: boolean }
}

export type QueueConfig = Omit<BullQueueOptions, 'connection' | 'skipVersionCheck'> & {
  defaultPrefix?: string
  connection?: QueueConnectionConfig
  globalConcurrency?: number
  defaultWorkerOptions?: WorkerOptions
}

export type WorkerOptions = Omit<
  BullWorkerOptions,
  'connection' | 'autorun' | 'name' | 'useWorkerThreads' | 'skipVersionCheck'
>

export type InferDataType<J extends BaseJob<any, any>> = J['job']['data']
export type InferReturnType<J extends BaseJob<any, any>> = J['job']['returnvalue']

/**
 * BullMQ job states
 */
export type JobState =
  | 'completed'
  | 'wait'
  | 'active'
  | 'paused'
  | 'prioritized'
  | 'delayed'
  | 'failed'

/**
 * Using declaration merging, one must extend this interface.
 * --------------------------------------------------------
 * MUST BE SET IN THE USER LAND.
 * --------------------------------------------------------
 */

export interface Queues {}
export interface BullVersion {}

export type InferQueues<Conf extends ConfigProvider<{ defaultQueue: unknown; queues: unknown }>> =
  Awaited<ReturnType<Conf['resolver']>>['queues']

/**
 * Check if user has configured BullMQ Pro version in their config.
 */
export type HasPro = BullVersion extends { version: 'pro' } ? true : false
