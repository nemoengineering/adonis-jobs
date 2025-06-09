import { Job } from '../../src/job.js'
import type { Queues } from '../../src/types.js'

export default class FakeSubDirJob extends Job<{ input: string }, { output: string }> {
  static defaultQueue: keyof Queues = 'default'

  async process(): Promise<{ output: string }> {
    return { output: this.data.input }
  }
}
