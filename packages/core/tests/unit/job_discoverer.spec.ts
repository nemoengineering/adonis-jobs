import { test } from '@japa/runner'

import { JobDiscoverer } from '../../src/worker/job_discoverer.js'
import { createFakeJob, setupApp, getActiveTestOrFail } from '../helpers.js'
import { DuplicateJobException } from '../../src/errors/duplicate_job_exception.js'

const kBuiltinJobs = ['CommandJob']
test.group('JobDiscoverer', () => {
  test('discovers jobs ending with _job.ts', async ({ assert }) => {
    const { app } = await setupApp()

    await createFakeJob({ path: 'app/jobs/user_job.ts', name: 'UserJob' })
    await createFakeJob({ path: 'app/services/notification_job.ts', name: 'NotificationJob' })

    const discoverer = new JobDiscoverer(app.appRoot)
    const jobs = await discoverer.discoverAndLoadJobs()

    const jobNames = jobs.map((job) => job.name)
    assert.include(jobNames, 'UserJob')
    assert.include(jobNames, 'NotificationJob')
  })

  test('ignores files not ending with _job.ts', async ({ assert }) => {
    const { app } = await setupApp()

    await createFakeJob({ path: 'app/jobs/user_job.ts', name: 'UserJob' })

    const test = getActiveTestOrFail()
    await test.context.fs.create('app/jobs/service.ts', '')
    await test.context.fs.create('app/jobs/helper.js', '')

    const discoverer = new JobDiscoverer(app.appRoot)
    const jobs = await discoverer.discoverAndLoadJobs()

    // Only the _job.ts file should be discovered
    assert.lengthOf(jobs, 1 + kBuiltinJobs.length)
    assert.equal(jobs[0].name, 'UserJob')
  })

  test('discovers jobs recursively in subdirectories', async ({ assert }) => {
    const { app } = await setupApp()

    await createFakeJob({ path: 'app/jobs/user_job.ts', name: 'UserJob' })
    await createFakeJob({ path: 'app/modules/billing/payment_job.ts', name: 'PaymentJob' })
    await createFakeJob({ path: 'app/services/email/newsletter_job.ts', name: 'NewsletterJob' })

    const discoverer = new JobDiscoverer(app.appRoot)
    const jobs = await discoverer.discoverAndLoadJobs()

    assert.lengthOf(jobs, 3 + kBuiltinJobs.length)
    const jobNames = jobs.map((job) => job.name).sort()
    assert.deepEqual(jobNames, ['CommandJob', 'NewsletterJob', 'PaymentJob', 'UserJob'])
  })

  test('filters out non-job classes', async ({ assert }) => {
    const { app } = await setupApp()

    await createFakeJob({ path: 'app/jobs/user_job.ts', name: 'UserJob' })

    const test = getActiveTestOrFail()
    await test.context.fs.create(
      'app/jobs/not_a_job.ts',
      `export default class NotAJob { doSomething() {} }`,
    )

    await test.context.fs.create(
      'app/jobs/another_job.ts',
      `export class AnotherJob { process() {} }`,
    )

    const discoverer = new JobDiscoverer(app.appRoot)
    const jobs = await discoverer.discoverAndLoadJobs()

    assert.lengthOf(jobs, 1 + kBuiltinJobs.length)
    assert.equal(jobs[0].name, 'UserJob')
  })

  test('detects duplicate job names and exits process', async ({ assert }) => {
    const { app } = await setupApp()

    await createFakeJob({ path: 'app/jobs/user_job.ts', name: 'UserJob' })
    await createFakeJob({ path: 'app/users/user_job.ts', name: 'UserJob' })

    const discoverer = new JobDiscoverer(app.appRoot)
    await assert.rejects(async () => {
      await discoverer.discoverAndLoadJobs()
    }, DuplicateJobException as any)
  })

  test('ignores jobs outside of ./app directory', async ({ assert }) => {
    const { app } = await setupApp()

    await createFakeJob({ path: 'app/jobs/user_job.ts', name: 'UserJob' })

    await createFakeJob({ path: 'config/email_job.ts', name: 'EmailJob' })
    await createFakeJob({ path: 'start/startup_job.ts', name: 'StartupJob' })
    await createFakeJob({ path: 'providers/provider_job.ts', name: 'ProviderJob' })

    const discoverer = new JobDiscoverer(app.appRoot)
    const jobs = await discoverer.discoverAndLoadJobs()

    assert.lengthOf(jobs, 1 + kBuiltinJobs.length)

    const jobNames = jobs.map((job) => job.name)
    assert.include(jobNames, 'UserJob')
    assert.notInclude(jobNames, 'EmailJob')
    assert.notInclude(jobNames, 'StartupJob')
    assert.notInclude(jobNames, 'ProviderJob')
  })
})
