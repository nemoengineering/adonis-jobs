import type { ConfigProvider } from '@adonisjs/core/types'
import type {
  ConnectionOptions,
  QueueOptions as BullQueueOptions,
  WorkerOptions as BullWorkerOptions,
} from 'bullmq'

import type { BaseJob } from '../job/base_job.js'
import type { QueueManager } from '../queue_manager.js'

export * from './scheduler.js'
export * from './events.js'

export interface QueueService extends QueueManager {}

export type { JobConstructor } from '../job/job.js'

export type Config<KnownQueues extends Record<string, QueueConfig>> = {
  connection: ConnectionOptions
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
 * Using declaration merging, one must extend this interface.
 * --------------------------------------------------------
 * MUST BE SET IN THE USER LAND.
 * --------------------------------------------------------
 */

export interface Queues {}

export type InferQueues<Conf extends ConfigProvider<{ defaultQueue: unknown; queues: unknown }>> =
  Awaited<ReturnType<Conf['resolver']>>['queues']
