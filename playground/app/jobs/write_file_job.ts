import { appendFile } from 'node:fs/promises'
import { Job } from '@nemoventures/adonis-jobs'

export type TestJobData = {
  data: string
}

export type TestJobReturn = {}

export default class WriteFileJob extends Job<TestJobData, TestJobReturn> {
  async process(): Promise<TestJobReturn> {
    const delayMs = Math.random() * 5000 + 1000
    this.logger.info(`Processing WriteFileJob with ${delayMs}ms delay`)

    await new Promise((resolve) => setTimeout(resolve, delayMs))

    await appendFile('test.txt', this.data.data + '\n', 'utf8')

    return {}
  }
}
