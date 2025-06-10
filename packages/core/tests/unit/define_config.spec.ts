import { test } from '@japa/runner'
import { AppFactory } from '@adonisjs/core/factories/app'
import type { ApplicationService } from '@adonisjs/core/types'

import { defineConfig } from '../../src/define_config.js'
import type { InferQueues, Queues } from '../../src/types/index.js'

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

declare module '@nemoventures/adonis-jobs/types' {
  interface Queues extends InferQueues<typeof queueConfigProvider> {}
}

test.group('defineConfig', () => {
  test('configuration', async ({ expectTypeOf }) => {
    const queueConfig = await queueConfigProvider.resolver(app)

    expectTypeOf(queueConfig.queues).toEqualTypeOf<Queues>()
  })
})
