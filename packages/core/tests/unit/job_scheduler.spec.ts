import { test } from '@japa/runner'

import Cleanup from '../fixtures/cleanup.js'
import type { JobScheduler } from '#job/job_scheduler'

test.group('Job Scheduler', () => {
  test('Schedule Typings', async ({ expectTypeOf }) => {
    const { FakeJob } = await import('../fixtures/fake_job.js')
    const { default: CommandJob } = await import('../../src/builtin/command_job.js')

    const p1 = {
      key: 'test-command-job',
      job: CommandJob.from(Cleanup),
      repeat: { pattern: '*/10 * * * * *' },
      data: { args: ['--verbose'] },
    }

    expectTypeOf<typeof JobScheduler.schedule>().toBeCallableWith(p1)

    const p2 = {
      key: 'test-command-job',
      job: CommandJob.from(Cleanup),
      repeat: { pattern: '*/10 * * * * *' },
      data: {},
    }

    expectTypeOf<typeof JobScheduler.schedule>().toBeCallableWith(p2)

    const p3 = {
      key: 'fake-job',
      job: FakeJob,
      data: { bar: 342, foo: 'foo' },
      repeat: { pattern: '*/5 * * * * *' },
    }

    expectTypeOf<typeof JobScheduler.schedule>().toBeCallableWith(p3)
  }).skip(true, 'Type checking only')
})
