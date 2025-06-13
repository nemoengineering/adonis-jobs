import { Job } from '#job/job'

export class FakeJob extends Job<{ foo: string; bar: number }, void> {
  async process() {
    this.logger.info('Fake job executed with data:', this.data)
  }
}
