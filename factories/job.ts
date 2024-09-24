import { Job } from '../src/job.js'

export class FakeJob extends Job<{ input: string }, { output: string }> {
  async process(): Promise<{ output: string }> {
    return { output: this.data.input }
  }
}
