import { defineConfig } from '@nemoventures/adonis-jobs'

const queueConfig = defineConfig({
  /**
   * The default connection to use. The connection
   * should be defined in the "config/redis.ts" file.
   */
  connection: { connectionName: 'queues' },

  /**
   * When enabled, all queues will use the same Redis connection instance.
   * This is the recommended setting for most applications.
   */
  useSharedConnection: true,

  /**
   * The name of the queue to use when no queue is explicitly specified
   * during job dispatching.
   */
  defaultQueue: 'default',

  /**
   * Configure your queues here. Each queue can have its own connection,
   * worker options, and job options
   */
  queues: {
    default: {},
    notifications: {},
    mails: {},
  },
})

export default queueConfig

declare module '@nemoventures/adonis-jobs/types' {
  interface Queues extends InferQueues<typeof queueConfig> {}
}
