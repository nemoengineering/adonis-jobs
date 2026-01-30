/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { uiRoutes } from '@nemoventures/adonis-jobs-ui-api'
import CommandJob from '@nemoventures/adonis-jobs/builtin/command_job'
import { queueDashUiRoutes } from '@nemoventures/adonis-jobs/ui/queuedash'
import { BulkDispatcher, JobChain, JobFlow, JobScheduler } from '@nemoventures/adonis-jobs'

import SlowJob from '#jobs/slow_job'
import Cleanup from '../commands/cleanup.js'
import WriteFileJob from '../app/jobs/write_file_job.js'
import NotificationJob from '../app/modules/notifications/jobs/notification_job.js'

router.get('/', async ({ view }) => view.render('home'))

router.get('/test-job', async () => {
  await WriteFileJob.dispatch({ data: 'Hello, World!' })
  return 'WriteFileJob dispatched!'
})

router.get('/slow-job/', async () => {
  await SlowJob.dispatch({ data: 'This is a slow job!' })
  return 'SlowJob dispatched!'
})

router.get('/notification-job', async () => {
  await NotificationJob.dispatch({
    body: 'This is a test notification',
    email: 'foo@ok.com',
    subject: 'Test Notification',
  })

  return 'NotificationJob dispatched!'
})

/**
 * Scheduler playground
 */
router.get('/test-scheduler/:queue?', async ({ params }) => {
  await JobScheduler.schedule({
    key: 'file-writer-scheduler',
    job: WriteFileJob,
    data: { data: 'Scheduled via JobScheduler!' },
    repeat: { pattern: '*/15 * * * * *' },
    queue: params.queue,
  })

  return 'Job scheduled via JobScheduler!'
})

/**
 * Command Jobs
 */
router.get('/scheduled-command-job', async () => {
  await JobScheduler.schedule({
    key: 'test-command-job',
    job: CommandJob.from(Cleanup as any),
    data: { args: ['--force'] },
    repeat: { pattern: '*/10 * * * * *' },
  })

  return 'Command job scheduled!'
})

router.get('/command-job', async () => {
  await CommandJob.from(Cleanup as any).dispatch({ args: ['--force'] })

  return 'Command job dispatched!'
})

router.get('/list-scheduled', async () => {
  const jobs = await JobScheduler.list()
  return { scheduledJobs: jobs }
})

router.get('/clear-scheduled', async () => {
  const count = await JobScheduler.clear()
  return { message: `Cleared ${count} scheduled jobs` }
})
router.get('/chain-job', async () => {
  await new JobChain([
    WriteFileJob.dispatch({ data: 'XXStep 1' }),
    WriteFileJob.dispatch({ data: 'XXStep 2' }),
    WriteFileJob.dispatch({ data: 'XXStep 3' }),
  ]).dispatch()
})

router.get('/flow-job', async () => {
  const parentJob = WriteFileJob.dispatch({ data: 'Step 1' })
  const flow = new JobFlow(parentJob)

  flow.addChildJob(WriteFileJob.dispatch({ data: 'Step 2' }))
  flow
    .addChildJob(WriteFileJob.dispatch({ data: 'Step 3' }), (child) => {
      child
        .addChildJob(WriteFileJob.dispatch({ data: 'Step3.1' }))
        .addChildJob(WriteFileJob.dispatch({ data: 'Step 3.2' }))
    })
    .addChildJob(WriteFileJob.dispatch({ data: 'Step 4' }))

  await flow.dispatch()
})

router.get('/flow-job-2', async () => {
  const parentJob = WriteFileJob.dispatch({ data: 'Main Flow Start' })
  const flow = new JobFlow(parentJob)

  flow.addChildJob(WriteFileJob.dispatch({ data: 'Data Validation' }), (dataFlow) => {
    for (let i = 1; i <= 3; i++) {
      dataFlow.addChildJob(WriteFileJob.dispatch({ data: `Process Batch ${i}` }), (batchFlow) => {
        batchFlow
          .addChildJob(WriteFileJob.dispatch({ data: `Batch ${i} - Transform` }))
          .addChildJob(WriteFileJob.dispatch({ data: `Batch ${i} - Validate` }))
      })
    }
  })

  flow.addChildJob(WriteFileJob.dispatch({ data: 'Notification Setup' }), (notifFlow) => {
    notifFlow
      .addChildJob(WriteFileJob.dispatch({ data: 'Email Queue' }), (emailFlow) => {
        for (let i = 1; i <= 2; i++) {
          emailFlow.addChildJob(WriteFileJob.dispatch({ data: `Email Batch ${i}` }))
        }
      })
      .addChildJob(WriteFileJob.dispatch({ data: 'SMS Queue' }), (smsFlow) => {
        smsFlow.addChildJob(WriteFileJob.dispatch({ data: 'SMS Processing' }))
      })
  })

  flow.addChildJob(WriteFileJob.dispatch({ data: 'Cleanup Start' }), (cleanupFlow) => {
    cleanupFlow
      .addChildJob(WriteFileJob.dispatch({ data: 'Temp Files Cleanup' }))
      .addChildJob(WriteFileJob.dispatch({ data: 'Generate Report' }), (reportFlow) => {
        reportFlow
          .addChildJob(WriteFileJob.dispatch({ data: 'Collect Metrics' }))
          .addChildJob(WriteFileJob.dispatch({ data: 'Generate Summary' }))
          .addChildJob(WriteFileJob.dispatch({ data: 'Send Report' }))
      })
  })

  await flow.dispatch()

  return 'Complex flow job dispatched with 20 jobs!'
})

router.get('/bulk', async () => {
  await new BulkDispatcher(
    Array.from({ length: 50 }, (_, i) => WriteFileJob.dispatch({ data: `Bulk job ${i + 1}` })),
  ).dispatch()

  return 'dispatched!'
})

/**
 * Deduplication POC
 *
 * Dispatches the same job 3 times with the same deduplication id.
 * Only the first one should be processed, the other two should be
 * deduplicated by BullMQ.
 */
router.get('/dedup', async () => {
  const results = []

  for (let i = 1; i <= 3; i++) {
    const job = await WriteFileJob.dispatch({ data: `Dedup attempt ${i}` }).with('deduplication', {
      id: 'my-dedup-key',
    })

    results.push({ jobId: job.id, attempt: i })
  }

  return { message: 'Dispatched 3 jobs with same dedup id', results }
})

/**
 * Deduplication with TTL (throttle mode)
 *
 * Dispatches 3 jobs with the same dedup id and a 10s TTL.
 * After the TTL expires, new jobs can be added again.
 */
router.get('/dedup-throttle', async () => {
  const results = []

  for (let i = 1; i <= 3; i++) {
    const job = await WriteFileJob.dispatch({ data: `Dedup throttle attempt ${i}` }).with(
      'deduplication',
      { id: 'my-throttle-key', ttl: 10_000 },
    )

    results.push({ jobId: job.id, attempt: i })
  }

  return { message: 'Dispatched 3 jobs with dedup ttl=10s', results }
})

queueDashUiRoutes().prefix('/admin/queue')
uiRoutes().prefix('/admin/jobs')
