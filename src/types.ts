import { Job } from './job.js'
import {
  ConnectionOptions,
  Job as BullJob,
  JobsOptions,
  QueueEvents,
  QueueOptions as BullQueueOptions,
  WorkerOptions as BullWorkerOptions,
  JobType,
} from 'bullmq'
import { BulkJobOptions } from 'bullmq'
import { Queue as BullQueue } from 'bullmq'
import { ConfigProvider } from '@adonisjs/core/types'

export type LazyWorkerImport = () => Promise<{ default: JobConstructor }>

export interface JobConstructor<J extends Job = Job> {
  new (...args: any[]): J
  defaultQueue?: keyof Queues
}

export type JobEvents<KnownJobs extends Record<string, Job>> = {
  'job:dispatched': EventWithJob<KnownJobs>
  'job:dispatched:many': EventWithManyJobs<KnownJobs>
  'job:started': EventWithJob<KnownJobs>
  'job:success': EventWithJob<KnownJobs>
  'job:error': EventWithJob<KnownJobs> & { error: Error }
  'job:failed': EventWithJob<KnownJobs> & { error: Error }
}

type EventWithJob<KnownJobs extends Record<string, Job>> = {
  [Name in keyof KnownJobs]: {
    jobName: Name
    // @ts-ignore
    job: BullJob<InferDataType<KnownJobs[Name]>, InferReturnType<KnownJobs[Name]>, keyof KnownJobs>
  }
}[keyof KnownJobs]

type EventWithManyJobs<KnownJobs extends Record<string, Job>> = {
  [Queue in keyof KnownJobs]: {
    queueName: Queue
    jobs: BullJob<InferDataType<KnownJobs[Queue]>, InferReturnType<KnownJobs[Queue]>>[]
  }
}[keyof KnownJobs]

export type Config<KnownQueues extends Record<string, QueueConfig>> = {
  connection: ConnectionOptions
  defaultQueue: keyof KnownQueues
  queues: KnownQueues
}

export type QueueConfig = Omit<BullQueueOptions, 'connection' | 'skipVersionCheck'> & {
  globalConcurrency?: number
}

export type WorkerOptions = Omit<BullWorkerOptions, 'connection' | 'autorun'>

export interface QueueContract<DataType, ReturnType> {
  dispatch(
    name: string,
    data: DataType,
    options?: JobsOptions
  ): Promise<BullJob<DataType, ReturnType>>
  dispatchAndWaitResult(name: string, data: DataType, options?: JobsOptions): Promise<ReturnType>
  dispatchMany(
    jobs: { name: string; data: DataType; opts?: BulkJobOptions }[]
  ): Promise<BullJob<DataType, ReturnType>[]>
  dispatchManyAndWaitResult(
    jobs: { name: string; data: DataType; opts?: BulkJobOptions }[]
  ): Promise<PromiseSettledResult<Awaited<ReturnType>>[]>

  getQueue(): Omit<BullQueue<DataType, ReturnType>, 'add' | 'addBulk'>
  getQueueEvents(): QueueEvents

  findJobsByName(
    name: string,
    types?: JobType | JobType[]
  ): Promise<BullJob<DataType, ReturnType>[]>

  hasJobWithName(name: string, types?: JobType | JobType[]): Promise<boolean>
}

export type InferDataType<W extends Job> = W['job']['data']
export type InferReturnType<W extends Job> = W['job']['returnvalue']

export type BullJobb<
  In,
  Out,
  KnownJobs extends Record<string, Job>,
  Name extends keyof KnownJobs,
  // @ts-ignore
> = BullJob<In, Out, Name>

export interface FlowJob<KnownJobs extends Record<string, Job>, Name extends keyof KnownJobs> {
  name: string
  queueName: Name
  data: InferDataType<KnownJobs[Name]>
  prefix?: string
  opts?: Omit<JobsOptions, 'parent' | 'repeat'>
  children?: FlowJobArg<KnownJobs>[]
}

export type FlowJobArg<
  KnownJobs extends Record<string, Job>,
  Name extends keyof KnownJobs = keyof KnownJobs,
> = Name extends keyof KnownJobs ? FlowJob<KnownJobs, Name> : never

/**
 * Using declaration merging, one must extend this interface.
 * --------------------------------------------------------
 * MUST BE SET IN THE USER LAND.
 * --------------------------------------------------------
 */

export interface Queues {}

export type InferQueues<Conf extends ConfigProvider<{ defaultQueue: unknown; queues: unknown }>> =
  Awaited<ReturnType<Conf['resolver']>>['queues']

/*export interface Jobs {}

export type InferJobs<JobDefs extends Record<string, LazyWorkerImport>> = {
  [Name in keyof JobDefs]: InstanceType<Awaited<ReturnType<JobDefs[Name]>>['default']>
}*/

/*
export interface JobService
  extends QueueManager<
    Queues extends Record<string, QueueConfig> ? Queues : never,
    Jobs extends Record<string, Job> ? Jobs : never
  > {}
*/
