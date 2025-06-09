import { appendFile } from 'node:fs/promises'
import { Job } from '@nemoventures/adonis-jobs'

export type TestJobData = {
  data: string
}

export type TestJobReturn = {}

export default class WriteFileJob extends Job<TestJobData, TestJobReturn> {
  async process(): Promise<TestJobReturn> {
    await appendFile('test.txt', this.data.data + '\n', 'utf8')

    return {}
  }
}
