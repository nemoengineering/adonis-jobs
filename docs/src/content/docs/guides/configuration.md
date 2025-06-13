---
title: Configuration
description: Configure queues, workers, and job settings for @nemoengineering/adonis-jobs
---

The package configuration is managed through the `config/queue.ts` file. This file defines your queues, worker settings, and global options.

## Default Queue

The `defaultQueue` property specifies which queue to use when no queue is explicitly defined:

```typescript
const queueConfig = defineConfig({
  defaultQueue: 'notifications', // Jobs go to 'notifications' queue by default
  queues: {
    notifications: {},
    processing: {},
  },
})
```

## Queue Settings

You can define multiple queues to organize your jobs based on different strategies. Common approaches include priority-based queues (`critical`, `normal`, `low`) for task importance, or type-based queues (`emails`, `reports`, `image-processing`...) for functional separation. 

Each queue can have its own configuration:

```typescript
const queueConfig = defineConfig({
  queues: {
    emails: {
      // Default options for jobs added to this queue
      defaultJobOptions: {
        removeOnComplete: 10,    // Keep 10 completed jobs
        removeOnFail: 50,        // Keep 50 failed jobs
        attempts: 3,             // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },

      // Default options for workers processing this queue
      defaultWorkerOptions: {
        concurrency: 5,          // Process 5 jobs simultaneously per worker
        removeOnComplete: { age: 24 * 3600 }, // Remove completed jobs after 24h
        removeOnFail: { age: 7 * 24 * 3600 }, // Remove failed jobs after 7 days
      },
    },
  },
})
```

Most options come from BullMQ, so make sure to check the [BullMQ documentation](https://docs.bullmq.io/) for more details on each available setting.

## Connection Settings

You must specify the Redis connection to use for dispatching and processing jobs. You can use the `connection.connectionName` property to specify a Redis connection. It should match one of the connections defined in your `config/redis.ts` file.

```typescript
const queueConfig = defineConfig({
  redisConnection: 'main', // Use 'main' connection from config/redis.ts
  queues: {
    default: {},
  },
})
```

### Shared Connection

By default, the package will create a new Redis connection for each queue. If you want to share a single connection across all queues, you can use the `useSharedConnection` option:

```typescript
const queueConfig = defineConfig({
  useSharedConnection: true, // Use a single shared Redis connection
})
```

For most applications, using a shared connection is recommended to reduce resource usage and improve performance. 

### Connection per Queue

If needed, you can also specify a different Redis connection for each queue:

```typescript
const queueConfig = defineConfig({
  queues: {
    default: {
      connection: { connectionName: 'main' }, // Use 'main' connection for default queue
    },
    emails: {
      connection: { connectionName: 'emails' }, // Use 'emails' connection for emails queue
    },
  },
})
```

## BullMQ Pro

To enable BullMQ Pro features, add the version declaration in the configuration file:

```typescript
declare module '@nemoengineering/adonis-jobs/types' {
  interface Queues extends InferQueues<typeof queueConfig> {}
  interface BullVersion {
    version: 'pro' // Enable BullMQ Pro features
  }
}
```

Also, make sure you have `@taskforcesh/bullmq-pro` installed.

## Health Checks

The `node ace queue:work` command will start an HTTP server that exposes an endpoint for health checks. This is useful for monitoring the queue status and ensuring that workers are running correctly.
You can configure the health check endpoint in the `config/queue.ts` file:

```typescript
const queueConfig = defineConfig({
  /**
   * Health check configuration for monitoring queue infrastructure
   */
  healthCheck: {
    enabled: true,
    endpoint: '/internal/healthz',
    checks: ({ connection }) => [
      new RedisCheck(connection),
      new RedisMemoryUsageCheck(connection)
        .warnWhenExceeds('100MB')
        .failWhenExceeds('200MB'),
    ],
  },
})
```

As you can see, we are using the AdonisJS Health Check module, so make sure you check out the [documentation](https://docs.adonisjs.com/guides/health-check) for more details on it. 

Now, you should be able to access the health check endpoint at `/internal/healthz` to monitor the status of your queues and workers.

## Next Steps

With your queues configured, learn how to [create your first job](/guides/creating-jobs).
