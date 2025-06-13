import { defineConfig } from '@nemoventures/adonis-jobs'
import { RedisCheck, RedisMemoryUsageCheck } from '@adonisjs/redis'

const queueConfig = defineConfig({
  /**
   * The default connection to use. The connection
   * should be defined in the "config/redis.ts" file.
   */
  connection: { connectionName: 'main' },

  /**
   * When enabled, all queues will use the same Redis connection instance.
   * This is the recommended setting for most applications.
   */
  useSharedConnection: true,

  /**
   * Health check configuration for monitoring queue infrastructure
   */
  healthCheck: {
    enabled: true,
    endpoint: '/internal/healthz',
    checks: ({ connection }) => [
      new RedisCheck(connection),
      new RedisMemoryUsageCheck(connection).warnWhenExceeds('100MB').failWhenExceeds('200MB'),
    ],
  },

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
    /**
     * The default queue for processing jobs
     */
    default: {},

    /**
     * Example of a queue with specific connection and options
     */
    priority: {
      globalConcurrency: 5,
      defaultWorkerOptions: {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      },
    },
  },
})

export default queueConfig

declare module '@nemoventures/adonis-jobs/types' {
  interface Queues extends InferQueues<typeof queueConfig> {}
}
