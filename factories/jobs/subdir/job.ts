import { Job } from '../../../src/job.js'
import { Queues } from '../../../src/types.js'

export default class FakeJob extends Job<{ input: string }, { output: string }> {
  static defaultQueue: keyof Queues = 'default'

  async process(): Promise<{ output: string }> {
    return { output: this.data.input }
  }
}
