import type { BaseJobConstructor } from '../job/base_job.js'
import type { BullJobsOptions, Queues, BullRepeatOptions } from './index.js'

export interface SchedulerRepeatOptions extends Omit<BullRepeatOptions, 'key' | 'jobId'> {}

export interface ScheduleJobOptions<T> {
  key: string
  repeat: SchedulerRepeatOptions
  job: BaseJobConstructor
  data: T
  options?: BullJobsOptions
  queue?: keyof Queues
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
