import type { JobsOptions, RepeatOptions } from 'bullmq'

import type { Queues } from './index.js'
import type { BaseJobConstructor } from '../job/base_job.js'

export interface SchedulerRepeatOptions extends Omit<RepeatOptions, 'key' | 'jobId'> {}

export interface ScheduleJobOptions<T> {
  key: string
  repeat: SchedulerRepeatOptions
  job: BaseJobConstructor
  data: T
  options?: JobsOptions
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
