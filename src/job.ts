import { Job as BullJob, Worker } from 'bullmq'
import { WorkerOptions } from './types.js'
export abstract class Job<DataType = any, ReturnType = any> {
  static workerOptions?: WorkerOptions

  job!: BullJob<DataType, ReturnType>
  worker!: Worker<DataType, ReturnType>
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

  $setWorker(worker: Worker<DataType, ReturnType>) {
    this.worker = worker
  }

  abstract process(...args: any[]): Promise<ReturnType>

  async onFailed(..._args: any[]): Promise<void> {}

  /**
   * Returns true if all attempts have been made according to the config at dispatch
   */
  allAttemptsMade(): boolean {
    return this.job.attemptsMade === this.job.opts.attempts || this.job.finishedOn !== undefined
  }
}
