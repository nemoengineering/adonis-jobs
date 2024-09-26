import { test } from '@japa/runner'
import { defineConfig } from '../../src/define_config.js'
import { InferQueues, JobService, Queues } from '../../src/types.js'
import { AppFactory } from '@adonisjs/core/factories/app'
import { ApplicationService } from '@adonisjs/core/types'
import { QueueManager } from '../../src/queue_manager.js'
import emitter from '@adonisjs/core/services/emitter'

const BASE_URL = new URL('./', import.meta.url)
const app = new AppFactory().create(BASE_URL, () => {}) as ApplicationService
await app.init()

const queueConfigProvider = defineConfig({
  connection: {},
  defaultQueue: 'default',
  queues: {
    default: {},
    mailer: {},
  },
})

const jobs = {
  fakeJob: () => import('../../factories/jobs/job.js'),
}

declare module '@nemoengineering/jobs/types' {
  interface Queues extends InferQueues<typeof queueConfigProvider> {}

  interface Jobs extends InferJobs<typeof jobs> {}
}

test.group('defineConfig', () => {
  test('configuration', async ({ expectTypeOf }) => {
    const queueConfig = await queueConfigProvider.resolver(app)

    expectTypeOf(queueConfig.queues).toEqualTypeOf<Queues>()

    /* const manager: JobService = new JobManager(app, emitter, queueConfig)
    manager.set(jobs)

    manager.use([() => import('../../factories/job.js')])*/

    /*  const a = await manager.dispatch('fakeJob', { input: '' })
    console.log(a.name)*/
  })
})
