import { defineConfig } from '@nemoventures/adonis-jobs'

import env from '#start/env'

const queueConfig = defineConfig({
  connection: {
    host: env.get('REDIS_HOST'),
    port: env.get('REDIS_PORT'),
    password: env.get('REDIS_PASSWORD'),
  },
  defaultQueue: 'default',
  queues: {
    default: {},
    test: {},
  },
})

export default queueConfig

declare module '@nemoventures/adonis-jobs/types' {
  interface Queues extends InferQueues<typeof queueConfig> {}
}
