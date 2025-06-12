import type { ConfigProvider } from '@adonisjs/core/types'
import type { RedisClusterConnection } from '@adonisjs/redis'
import type { RedisConnections } from '@adonisjs/redis/types'

import type { BaseJob } from '../job/base_job.js'
import type { QueueManager } from '../queue_manager.js'
import type { BullQueueOptions, BullWorkerOptions } from './bull.js'

export * from './scheduler.js'
export * from './events.js'
export * from './bull.js'
export type { JobConstructor } from '../job/job.js'

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  enabled: boolean
  endpoint?: string
  checks?: (context: { connection: RedisClusterConnection }) => any[]
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
  queues: KnownQueues
  healthCheck?: HealthCheckConfig

  /**
   * Multi logger allows you to use the AdonisJS logger as usual within your jobs,
   * but logs will be sent to both your configured Pino destinations (console, files, etc.)
   * AND to the BullMQ job logs (visible in the queue dashboard).
   */
  multiLogger?: { enabled?: boolean }
}

export type QueueConfig = Omit<BullQueueOptions, 'connection' | 'skipVersionCheck'> & {
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
