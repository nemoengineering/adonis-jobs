import app from '@adonisjs/core/services/app'
import { JobService } from '../src/types.js'

let jobs: JobService

await app.booted(async () => {
  jobs = await app.container.make('job.manager')
})

export { jobs as default }
