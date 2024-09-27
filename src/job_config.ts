import { JobsOptions } from 'bullmq'

export class JobConfig {
  protected jobOptions?: JobsOptions

  with<K extends keyof Required<JobsOptions>>(key: K, value: Required<JobsOptions>[K]) {
    if (!this.jobOptions) {
      this.jobOptions = {}
    }

    this.jobOptions[key] = value
    return this
  }
}
