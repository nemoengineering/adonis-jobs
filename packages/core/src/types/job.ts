import type { BaseJobConstructor } from '../job/base_job.ts'

export interface PrebuiltJobData<TJobData = Record<string, any>, TAdditionalData = {}> {
  job: BaseJobConstructor
  data: TJobData
  additionalData?: TAdditionalData
}
