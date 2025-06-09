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
import { queueDashUiRoutes } from '@nemoventures/adonis-jobs/ui/queuedash'

import SlowJob from '#jobs/slow_job'
import WriteFileJob from '../app/jobs/write_file_job.js'

router.get('/', async () => 'It works!')

router.get('/test-job', async () => {
  await WriteFileJob.dispatch({ data: 'Hello, World!' })
  return 'WriteFileJob dispatched!'
})

router.get('/slow-job/', async () => {
  await SlowJob.dispatch({ data: 'This is a slow job!' })
  return 'SlowJob dispatched!'
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

router.get('/list-scheduled', async () => {
  const jobs = await JobScheduler.list()
  return { scheduledJobs: jobs }
})

router.get('/clear-scheduled', async () => {
  const count = await JobScheduler.clear()
  return { message: `Cleared ${count} scheduled jobs` }
})

queueDashUiRoutes().prefix('/admin/queue')
