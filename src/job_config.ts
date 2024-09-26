import { JobsOptions } from 'bullmq'

export class JobConfig {
  protected jobOptions: JobsOptions = {}

  with<K extends keyof Required<JobsOptions>>(key: K, value: Required<JobsOptions>[K]) {
    this.jobOptions[key] = value
    return this
  }
}
