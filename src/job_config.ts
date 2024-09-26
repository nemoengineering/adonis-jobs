import { JobsOptions } from 'bullmq'

export class JobConfig {
  protected queueConfig: JobsOptions = {}

  with<K extends keyof Required<JobsOptions>>(key: K, value: Required<JobsOptions>[K]) {
    this.queueConfig[key] = value
    return this
  }
}
