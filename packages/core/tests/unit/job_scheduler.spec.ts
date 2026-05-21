import { test } from '@japa/runner'

import Cleanup from '../fixtures/cleanup.ts'
import { setQueueServiceForTesting } from '../../services/main.ts'
import type { JobScheduler as JobSchedulerType } from '#job/job_scheduler'

interface FakeQueue {
  removeJobScheduler: (id: string) => Promise<boolean>
  calls: string[]
}

function makeFakeQueue(removed: boolean | Error): FakeQueue {
  const queue: FakeQueue = {
    calls: [],
    async removeJobScheduler(id: string) {
      queue.calls.push(id)
      if (removed instanceof Error) throw removed
      return removed
    },
  }
  return queue
}

function installFakeQueueManager(queues: Record<string, FakeQueue>) {
  const fakeManager = {
    config: {
      queues: Object.fromEntries(Object.keys(queues).map((name) => [name, {}])),
    },
    useQueue(name: string) {
      const queue = queues[name]
      if (!queue) throw new Error(`Unexpected useQueue call for "${name}"`)
      return queue
    },
  }
  setQueueServiceForTesting(fakeManager as never)
}

test.group('Job Scheduler', () => {
  test('Schedule Typings', async ({ expectTypeOf }) => {
    const { FakeJob } = await import('../fixtures/fake_job.ts')
    const { default: CommandJob } = await import('../../src/builtin/command_job.ts')

    const p1 = {
      key: 'test-command-job',
      job: CommandJob.from(Cleanup),
      repeat: { pattern: '*/10 * * * * *' },
      data: { args: ['--verbose'] },
    }

    expectTypeOf<typeof JobSchedulerType.schedule>().toBeCallableWith(p1)

    const p2 = {
      key: 'test-command-job',
      job: CommandJob.from(Cleanup),
      repeat: { pattern: '*/10 * * * * *' },
      data: {},
    }

    expectTypeOf<typeof JobSchedulerType.schedule>().toBeCallableWith(p2)

    const p3 = {
      key: 'fake-job',
      job: FakeJob,
      data: { bar: 342, foo: 'foo' },
      repeat: { pattern: '*/5 * * * * *' },
    }

    expectTypeOf<typeof JobSchedulerType.schedule>().toBeCallableWith(p3)
  }).skip(true, 'Type checking only')
})

test.group('JobScheduler.remove', () => {
  test('returns true and keeps scanning when the scheduler lives on a later queue', async ({
    assert,
  }) => {
    const defaultQueue = makeFakeQueue(false)
    const emailsQueue = makeFakeQueue(true)
    installFakeQueueManager({ default: defaultQueue, emails: emailsQueue })

    const { JobScheduler } = await import('#job/job_scheduler')
    const result = await JobScheduler.remove('nightly-email')

    assert.isTrue(result)
    assert.deepEqual(defaultQueue.calls, ['nightly-email'])
    assert.deepEqual(emailsQueue.calls, ['nightly-email'])
  })

  test('returns false when no queue actually removes the scheduler', async ({ assert }) => {
    const defaultQueue = makeFakeQueue(false)
    const emailsQueue = makeFakeQueue(false)
    installFakeQueueManager({ default: defaultQueue, emails: emailsQueue })

    const { JobScheduler } = await import('#job/job_scheduler')
    const result = await JobScheduler.remove('nightly-email')

    assert.isFalse(result)
    assert.deepEqual(defaultQueue.calls, ['nightly-email'])
    assert.deepEqual(emailsQueue.calls, ['nightly-email'])
  })

  test('continues past a queue that throws', async ({ assert }) => {
    const defaultQueue = makeFakeQueue(new Error('boom'))
    const emailsQueue = makeFakeQueue(true)
    installFakeQueueManager({ default: defaultQueue, emails: emailsQueue })

    const { JobScheduler } = await import('#job/job_scheduler')
    const result = await JobScheduler.remove('nightly-email')

    assert.isTrue(result)
    assert.deepEqual(defaultQueue.calls, ['nightly-email'])
    assert.deepEqual(emailsQueue.calls, ['nightly-email'])
  })

  test('short-circuits on first successful removal', async ({ assert }) => {
    const defaultQueue = makeFakeQueue(true)
    const emailsQueue = makeFakeQueue(false)
    installFakeQueueManager({ default: defaultQueue, emails: emailsQueue })

    const { JobScheduler } = await import('#job/job_scheduler')
    const result = await JobScheduler.remove('nightly-email')

    assert.isTrue(result)
    assert.deepEqual(defaultQueue.calls, ['nightly-email'])
    assert.deepEqual(emailsQueue.calls, [])
  })
})
