import type { ConfigProvider } from '@adonisjs/core/types'

import type { BaseJob } from '../job/base_job.js'
import type { QueueManager } from '../worker_manager/queue_manager.js'
import type { BullQueueOptions, BullWorkerOptions, BullConnectionOptions } from './bull.js'

export * from './scheduler.js'
export * from './events.js'
export * from './bull.js'
export type { JobConstructor } from '../job/job.js'

export interface QueueService extends QueueManager {}

export type Config<KnownQueues extends Record<string, QueueConfig>> = {
  connection: BullConnectionOptions
  defaultQueue: keyof KnownQueues
  queues: KnownQueues
}

export type QueueConfig = Omit<BullQueueOptions, 'connection' | 'skipVersionCheck'> & {
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
