import { Job } from '@nemoventures/adonis-jobs'

export type SlowJobData = {
  data: string
}

export type SlowJobReturn = {}

export default class SlowJob extends Job<SlowJobData, SlowJobReturn> {
  async process(): Promise<SlowJobReturn> {
    this.logger.info('Processing SlowJob with data:', this.data)

    await new Promise((resolve) => setTimeout(resolve, 10_000))
    this.logger.info(
      {
        message: 'SlowJob completed',
        foo: Math.random(),
        data: this.data,
      },
      'SlowJob completed successfully',
    )

    this.logger.info('Finished processing SlowJob')

    return {}
  }
}
