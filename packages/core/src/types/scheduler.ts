import type { PrebuiltJobData } from './job.ts'
import type { BaseJobConstructor } from '../job/base_job.ts'
import type { BullJobsOptions, Queues, BullRepeatOptions, InferDataType } from './index.ts'

export interface SchedulerRepeatOptions extends Omit<BullRepeatOptions, 'key' | 'jobId'> {}

interface BaseScheduleOptions {
  key: string
  repeat: SchedulerRepeatOptions
  options?: BullJobsOptions
  queue?: keyof Queues
}

export interface ScheduleJobOptions<J extends BaseJobConstructor> extends BaseScheduleOptions {
  job: J
  data: InferDataType<InstanceType<J>>
}

export interface ScheduleJobOptionsWithPrebuilt<
  TPrebuiltJob extends PrebuiltJobData<any>,
> extends BaseScheduleOptions {
  job: TPrebuiltJob
  data?: TPrebuiltJob['additionalData']
}

export interface ScheduledJobInfo {
  key: string
  name: string
  pattern?: string
  timezone?: string
  nextRun: Date
  endDate?: Date
  queue: string
  data: any
}
