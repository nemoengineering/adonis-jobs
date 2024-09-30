import { Job } from './job.js'
import {
  ConnectionOptions,
  Job as BullJob,
  JobNode,
  QueueOptions as BullQueueOptions,
  WorkerOptions as BullWorkerOptions,
} from 'bullmq'
import { ConfigProvider } from '@adonisjs/core/types'
import { QueueManager } from './queue_manager.js'

export interface QueueService extends QueueManager {}

export type { JobConstructor } from './job.js'

export type JobEvents = {
  'job:dispatched': EventWithJob
  'job:dispatched:many': EventWithManyJobs
  'job:dispatched:chain': EventWithFlow
  'job:dispatched:flow': EventWithFlow
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

type EventWithFlow = {
  flow: JobNode
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

export type InferDataType<J extends Job> = J['job']['data']
export type InferReturnType<J extends Job> = J['job']['returnvalue']

/**
 * Using declaration merging, one must extend this interface.
 * --------------------------------------------------------
 * MUST BE SET IN THE USER LAND.
 * --------------------------------------------------------
 */

export interface Queues {}

export type InferQueues<Conf extends ConfigProvider<{ defaultQueue: unknown; queues: unknown }>> =
  Awaited<ReturnType<Conf['resolver']>>['queues']
