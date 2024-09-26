import { Job } from './job.js'
import {
  ConnectionOptions,
  Job as BullJob,
  QueueOptions as BullQueueOptions,
  WorkerOptions as BullWorkerOptions,
} from 'bullmq'
import { ConfigProvider } from '@adonisjs/core/types'
import { QueueManager } from './queue_manager.js'

export interface JobConstructor<J extends Job = Job> {
  new (...args: any[]): J
  defaultQueue?: keyof Queues
}

export type JobEvents = {
  'job:dispatched': EventWithJob
  'job:dispatched:many': EventWithManyJobs
  'job:started': EventWithJob
  'job:success': EventWithJob
  'job:error': EventWithJob & { error: Error }
  'job:failed': EventWithJob & { error: Error }
}

type EventWithJob = {
  job: BullJob
}

type EventWithManyJobs = {
  jobs: BullJob[]
}

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

export type InferDataType<W extends Job> = W['job']['data']
export type InferReturnType<W extends Job> = W['job']['returnvalue']

/**
 * Using declaration merging, one must extend this interface.
 * --------------------------------------------------------
 * MUST BE SET IN THE USER LAND.
 * --------------------------------------------------------
 */

export interface Queues {}

export type InferQueues<Conf extends ConfigProvider<{ defaultQueue: unknown; queues: unknown }>> =
  Awaited<ReturnType<Conf['resolver']>>['queues']

export interface QueueService extends QueueManager {}
