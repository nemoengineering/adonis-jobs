import { inject } from '@adonisjs/core'
import { appendFile } from 'node:fs/promises'
import { Job } from '@nemoventures/adonis-jobs'
import { BullJobsOptions } from '@nemoventures/adonis-jobs/types'

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

  static options: BullJobsOptions = {
    attempts: 5,
  }

  async process(): Promise<TestJobReturn> {
    const delayMs = Math.random() * 5000 + 1000

    this.testService.doSomething()

    this.logger.info(`Processing WriteFileJob with ${delayMs}ms delay`)
    this.logger.debug({ data: this.data }, 'WriteFileJob data')

    if (Math.random() < 0.3) {
      this.logger.error('Simulated error in WriteFileJob')
      throw new Error('Simulated error in WriteFileJob')
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs))
    this.logger.info(`WriteFileJob completed after ${delayMs}ms`)

    await appendFile('test.txt', this.data.data + '\n', 'utf8')

    return { result: delayMs }
  }
}
