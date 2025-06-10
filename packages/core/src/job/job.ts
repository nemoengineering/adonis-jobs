import { BaseJob } from './base_job.js'
import { JobDispatcher } from './job_dispatcher.js'
import type { InferDataType } from '../types/index.js'
import type { BaseJobConstructor } from './base_job.js'

/**
 * Arguments to be passed to the `dispatch` method of a job
 * - If the job's data type is `undefined`, no arguments are required.
 * - Same if the job's data type is an empty object.
 */
type DispatchArgs<J extends BaseJob<any, any>> =
  InferDataType<J> extends undefined
    ? []
    : InferDataType<J> extends Record<string, never>
      ? [data?: InferDataType<J>]
      : [data: InferDataType<J>]

export type JobConstructor<JobInstance extends BaseJob<any, any> = BaseJob<any, any>> =
  BaseJobConstructor<JobInstance> & {
    dispatch<J extends JobInstance>(
      this: JobConstructor<J>,
      ...args: DispatchArgs<J>
    ): JobDispatcher<JobConstructor<J>, InferDataType<J>>
  }

export abstract class Job<DataType, ReturnType> extends BaseJob<DataType, ReturnType> {
  /**
   * Dispatch the job to the queue
   */
  static dispatch<J extends Job<any, any>>(this: JobConstructor<J>, ...args: DispatchArgs<J>) {
    return new JobDispatcher(this, args[0] as InferDataType<J>)
  }
}
