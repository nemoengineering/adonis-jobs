import { Worker } from './worker.js'
import { ConnectionOptions, Job, JobsOptions } from 'bullmq'
import { QueueManager } from './queue_manager.js'
import { ConfigProvider } from '@adonisjs/core/types'
import { BulkJobOptions } from 'bullmq/dist/esm/interfaces/index.js'

export type { ConnectionOptions, Job, JobsOptions } from 'bullmq'

export type WorkerManagerWorkerFactory = () => Worker

//@ts-expect-error
export type WorkerEvents<KnownWorkers extends Record<string, WorkerManagerWorkerFactory>> = {}

export type Config = {
  connection: ConnectionOptions
}

export type WorkerOptions = {
  workerOpts?: Omit<WorkerOptions, 'connection'>
}

export interface JobContract<DataType, ReturnType> {
  dispatch(name: string, data: DataType): Promise<Job<DataType, ReturnType>>
  dispatchAndWaitResult(name: string, data: DataType): Promise<ReturnType>
  dispatchMany(
    jobs: { name: string; data: DataType; opts?: BulkJobOptions }[]
  ): Promise<Job<DataType, ReturnType>[]>
  dispatchManyAndWaitResult(
    jobs: { name: string; data: DataType; opts?: BulkJobOptions }[]
  ): Promise<PromiseSettledResult<Awaited<ReturnType>>[]>
}

export type InferDataType<WorkerFactory extends WorkerManagerWorkerFactory> = Parameters<
  Awaited<ReturnType<WorkerFactory>['dispatchAndWaitResult']>
>[1]

export type InferReturnType<WorkerFactory extends WorkerManagerWorkerFactory> = Awaited<
  ReturnType<ReturnType<WorkerFactory>['dispatchAndWaitResult']>
>

export interface FlowJob<
  KnownWorkers extends Record<string, WorkerManagerWorkerFactory>,
  Name extends keyof KnownWorkers,
> {
  name: string
  queueName: Name
  data: InferDataType<KnownWorkers[Name]>
  prefix?: string
  opts?: Omit<JobsOptions, 'parent' | 'repeat'>
  children?: FlowJobArg<KnownWorkers>[]
}

export type FlowJobArg<
  KnownWorkers extends Record<string, WorkerManagerWorkerFactory>,
  Name extends keyof KnownWorkers = keyof KnownWorkers,
> = Name extends keyof KnownWorkers ? FlowJob<KnownWorkers, Name> : never

export interface JobNode<
  FlowJobT extends FlowJobArg<KnownWorkers>,
  KnownWorkers extends Record<string, WorkerManagerWorkerFactory>,
> {
  job: Job<
    InferDataType<KnownWorkers[FlowJobT['queueName']]>,
    InferReturnType<KnownWorkers[FlowJobT['queueName']]>
  >
  children: JobNode<any, KnownWorkers>[]
}

/**
 * Using declaration merging, one must extend this interface.
 * --------------------------------------------------------
 * MUST BE SET IN THE USER LAND.
 * --------------------------------------------------------
 */

export interface Workers {}

export type InferWorkers<
  T extends ConfigProvider<{ workers: Record<string, WorkerManagerWorkerFactory> }>,
> = Awaited<ReturnType<T['resolver']>>['workers']

export interface QueueService
  extends QueueManager<
    Workers extends Record<string, WorkerManagerWorkerFactory> ? Workers : never
  > {}
