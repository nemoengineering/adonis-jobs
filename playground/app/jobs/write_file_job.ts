import { inject } from '@adonisjs/core'
import { appendFile } from 'node:fs/promises'
import { Job } from '@nemoventures/adonis-jobs'

import { TestService } from '#services/test_service'

export type TestJobData = {
  data: string
}

export type TestJobReturn = {}

@inject()
export default class WriteFileJob extends Job<TestJobData, TestJobReturn> {
  constructor(protected testService: TestService) {
    super()
  }

  async process(): Promise<TestJobReturn> {
    const delayMs = Math.random() * 5000 + 1000

    this.testService.doSomething()

    this.logger.info(`Processing WriteFileJob with ${delayMs}ms delay`)
    this.logger.debug({ data: this.data }, 'WriteFileJob data')
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    this.logger.error({ err: new Error('Test error') }, 'An error occurred in WriteFileJob')

    await appendFile('test.txt', this.data.data + '\n', 'utf8')

    return {}
  }
}
