import { Job as BullJob } from 'bullmq'
import { WorkerOptions } from './types.js'
export abstract class Job<DataType = any, ReturnType = any> {
  static workerOptions?: WorkerOptions

  job!: BullJob<DataType, ReturnType>
  token?: string
  error?: Error

  $setJob(job: BullJob<DataType, ReturnType>, token?: string) {
    this.job = job
    this.token = token
  }

  $setFailed(job: BullJob<DataType, ReturnType>, error: Error) {
    this.job = job
    this.error = error
  }

  abstract process(...args: any[]): Promise<ReturnType>

  async onFailed(..._args: any[]): Promise<void> {}
}
