import { Job } from 'bullmq'
import { WorkerOptions } from './types.js'
export abstract class Worker<DataType = any, ReturnType = any> {
  static workerOptions?: WorkerOptions

  job!: Job<DataType, ReturnType>
  token?: string
  error?: Error

  $setJob(job: Job<DataType, ReturnType>, token?: string) {
    this.job = job
    this.token = token
  }

  $setFailed(job: Job<DataType, ReturnType>, error: Error) {
    this.job = job
    this.error = error
  }

  abstract process(...args: any[]): Promise<ReturnType>

  async onFailed(..._args: any[]): Promise<void> {}
}
