/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

import WriteFileJob from '../app/jobs/write_file_job.js'

router.get('/', async () => 'It works!')

router.get('/test-job', async () => {
  await WriteFileJob.dispatch({ data: 'Hello, World!' })

  return 'Job dispatched!'
})
