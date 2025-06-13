/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { JobScheduler } from '@nemoventures/adonis-jobs'
import CommandJob from '@nemoventures/adonis-jobs/builtin/command_job'
import { queueDashUiRoutes } from '@nemoventures/adonis-jobs/ui/queuedash'

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

queueDashUiRoutes().prefix('/admin/queue')
