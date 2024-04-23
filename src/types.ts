import { Job } from './job.js'
import {
  ConnectionOptions,
  Job as BullJob,
  JobsOptions,
  WorkerOptions as BullWorkerOptions,
} from 'bullmq'
import { JobManager } from './job_manager.js'
import { BulkJobOptions } from 'bullmq/dist/esm/interfaces/index.js'

export type { ConnectionOptions, Job, JobsOptions } from 'bullmq'

export type LazyWorkerImport = () => Promise<{ default: JobConstructor }>

export interface JobConstructor {
  new (...args: any[]): Job
  workerOptions?: WorkerOptions
}

//@ts-expect-error
export type JobEvents<KnownJobs extends Record<string, Job>> = {}

export type Config = {
  connection: ConnectionOptions
}

export type WorkerOptions = Omit<BullWorkerOptions, 'connection' | 'autorun'>

export interface JobContract<DataType, ReturnType> {
  dispatch(name: string, data: DataType): Promise<BullJob<DataType, ReturnType>>
  dispatchAndWaitResult(name: string, data: DataType): Promise<ReturnType>
  dispatchMany(
    jobs: { name: string; data: DataType; opts?: BulkJobOptions }[]
  ): Promise<BullJob<DataType, ReturnType>[]>
  dispatchManyAndWaitResult(
    jobs: { name: string; data: DataType; opts?: BulkJobOptions }[]
  ): Promise<PromiseSettledResult<Awaited<ReturnType>>[]>
}

export type InferDataType<W extends Job> = W['job']['data']
export type InferReturnType<W extends Job> = W['job']['returnvalue']

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

/*export interface JobNode<
  FlowJobT extends FlowJobArg<KnownJobs>,
  KnownJobs extends Record<string, WorkerManagerWorkerFactory>,
> {
  job: Job<
    InferDataType<KnownJobs[FlowJobT['queueName']]>,
    InferReturnType<KnownJobs[FlowJobT['queueName']]>
  >
  children: JobNode<any, KnownJobs>[]
}*/

/**
 * Using declaration merging, one must extend this interface.
 * --------------------------------------------------------
 * MUST BE SET IN THE USER LAND.
 * --------------------------------------------------------
 */

export interface Jobs {}

export interface JobService extends JobManager<Jobs extends Record<string, Job> ? Jobs : never> {}
