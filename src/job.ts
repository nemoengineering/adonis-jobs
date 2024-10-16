import { InferDataType } from './types.js'
import { JobDispatcher } from './job_dispatcher.js'
import { BaseJob, BaseJobConstructor } from './base_job.js'

export type JobConstructor<JobInstance extends BaseJob<any, any> = BaseJob<any, any>> =
  BaseJobConstructor<JobInstance> & {
    dispatch<J extends JobInstance>(
      this: JobConstructor<J>,
      data: InferDataType<J>
    ): JobDispatcher<JobConstructor<J>, InferDataType<J>>
  }

export abstract class Job<DataType, ReturnType> extends BaseJob<DataType, ReturnType> {
  /**
   * Dispatch the job to the queue
   * @param data
   */
  static dispatch<J extends Job<any, any>>(this: JobConstructor<J>, data: InferDataType<J>) {
    return new JobDispatcher(this, data)
  }
}
