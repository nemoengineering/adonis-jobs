# Configuration

The configuration for the jobs is stored inside the `config/queue.ts` file.

```typescript
import {defineConfig} from '@nemoengineering/adonis-jobs'
import Env from "#start/env";

const queueConfig = defineConfig({
  connection: {
    host: Env.get('REDIS_HOST'),
    port: Env.get('REDIS_PORT'),
    password: Env.get('REDIS_PASSWORD'),
  },
  defaultQueue: 'default',
  queues: {
    default: {},
    emails: {}
  },
})

export default queueConfig

declare module '@nemoengineering/adonis-jobs/types' {
  interface Queues extends InferQueues<typeof queueConfig> {
  }
}
```

**connection**<br/>
<small>Specifies the details of the connection to Redis.</small>

---

**defaultQueue**<br/>
<small>The name of the queue where jobs are dispatched by default.</small>

---

**queues**<br/>
<small>A collection of queues with their configuration on which jobs may be dispatched.</small>

## Queue configuration

Each queue accepts the following set of options:

```typescript
{
  // How many jobs are allowed to be processed in parallel across all your worker instances.
  globalConcurrency: number;

  // Denotes commands should retry indefinitely.
  blockingConnection: boolean;

  // Prefix for all queue keys.
  prefix: string;

  // Default options for each job dispatched on the queue.  
  defaultJobOptions: {
    // Read more at:
    // https://api.docs.bullmq.io/interfaces/v5.DefaultJobOptions.html
  }

  // Default options of the worker that will process the queue.
  defaultWorkerOptions: {
    // Read more at:
    // https://api.docs.bullmq.io/interfaces/v5.WorkerOptions.html
  }
}
```

## Pruning old jobs

Completed and failed jobs are stored indefinitely. In order to remove them automatically from their queue you can
specify the following options. You can read more
about [auto-removal of jobs here](https://docs.bullmq.io/guide/queues/auto-removal-of-jobs).

```typescript {7-13}
const queueConfig = defineConfig({
  connection: { /* ... */},
  defaultQueue: 'default',
  queues: {
    default: {
      defaultWorkerOptions: {
        removeOnComplete: {
          age: string.seconds.parse('3 days')
        },
        removeOnFail: {
          age: string.seconds.parse('7 days'),
          count: 1000
        },
      },
    },
  },
})
```

<small>In this example completed jobs on the `default` queue are removed automatically after 3 days while failed jobs are
removed after 7 days and up to 1000 items.</small>

## Rate limiting

It is possible to configure queues and their underlying workers so that they obey to a given rate limiting
specification. You can read more about [rate limiting here](https://docs.bullmq.io/guide/rate-limiting).

```typescript {7-10}
const queueConfig = defineConfig({
  connection: { /* ... */},
  defaultQueue: 'default',
  queues: {
    default: {
      defaultWorkerOptions: {
        limiter: {
          max: 50,
          duration: 1000
        },
      },
    },
  },
})
```

<small>In this example we limit the `default` queue to processing a maximum of 50 jobs in a 1000ms interval.</small> 
