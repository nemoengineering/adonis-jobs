import { Worker } from './worker.js'
import { ConnectionOptions, Job } from 'bullmq'
import { WorkerManager } from './worker_manager.js'
import { ConfigProvider } from '@adonisjs/core/types'

//TODO: export bull job type

export type WorkerManagerWorkerFactory = () => Worker

//@ts-expect-error
export type WorkerEvents<KnownWorkers extends Record<string, WorkerManagerWorkerFactory>> = {}

export type Config = {
  connection: ConnectionOptions
}

export type WorkerOptions = {
  workerOpts?: Omit<WorkerOptions, 'connection'>
}

export interface WorkerDispatch<DataType, ReturnType> {
  dispatch(name: string, data: DataType): Promise<Job<DataType, ReturnType>>
  dispatchAndWaitResult(name: string, data: DataType): Promise<ReturnType>
}

export type InferDataType<WorkerFactory extends WorkerManagerWorkerFactory> = Parameters<
  ReturnType<WorkerFactory>['dispatchAndWaitResult']
>[1]

export type InferReturnType<WorkerFactory extends WorkerManagerWorkerFactory> = Awaited<
  ReturnType<ReturnType<WorkerFactory>['dispatchAndWaitResult']>
>

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

export interface WorkerService
  extends WorkerManager<
    Workers extends Record<string, WorkerManagerWorkerFactory> ? Workers : never
  > {}
