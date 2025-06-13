---
title: Dispatching Jobs
description: Learn how to dispatch jobs, configure options, and handle job results
---

Once you've created a job, you need to dispatch it to a queue for processing.

## Basic Dispatching

The simplest way to dispatch a job:

```typescript
import SendEmailJob from '#jobs/send_email_job'

// Dispatch and forget
await SendEmailJob.dispatch({
  to: 'user@example.com',
  subject: 'Welcome!',
  template: 'welcome',
  variables: { name: 'John' }
})
```

## Waiting for Results

Get the result of a job execution:

```typescript
const result = await SendEmailJob
  .dispatch({ to: 'user@example.com', subject: 'Test' })
  .waitResult()

console.log('Email sent with ID:', result.messageId)
```

## Job Options

Configure how jobs are processed using the `with()` method:

```typescript
await SendEmailJob
  .dispatch(emailData)
  .with('attempts', 5)
  .with('backoff', {
    type: 'exponential',
    delay: 2000,
  })
  .with('delay', 1000)
```

Again, make sure to check the [BullMQ documentation](https://docs.bullmq.io/) for available options since all options come from BullMQ.

### Dispatch to Specific Queue

Send a job to a specific queue:

```typescript
await SendEmailJob
  .dispatch(emailData)
  .onQueue('emails')
```

### Default Queue in Job Class

Set a default queue for all instances of a job:

```typescript
export default class SendEmailJob extends Job<EmailData, void> {
  static defaultQueue: keyof Queues = 'emails'
  
  async process(): Promise<void> {
    // Job logic
  }
}

// This will automatically use the 'emails' queue
await SendEmailJob.dispatch(emailData)
```

## Scheduled Jobs

You can dispatch jobs that run on a schedule using the JobScheduler. Under the hood, it uses [BullMQ's Job Scheduler](https://docs.bullmq.io/guide/job-schedulers).

```typescript
await JobScheduler.schedule({
  // A key to identify the job. Will be used to prevent duplicate jobs.
  // And can be used to remove/update the job later.
  key: 'file-writer-scheduler',
  job: WriteFileJob,
  data: { data: 'Scheduled via JobScheduler!' },
  // Repeat options. Check BullMQ's documentation for available strategies.
  repeat: { pattern: '*/15 * * * * *' },
  // Queue to dispatch the job to
  queue: params.queue,
  // Additional job options
  options: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000, },
  },
})
```

Internally, we use the the `upsertJobScheduler` method, so calling this method is idempotent. If a job with the same `key` already exists, it will be updated with the new data and options as you would expect and it will not create a duplicate job.

Once scheduled, you will also be able to delete it using the `JobScheduler.remove` method:

```typescript
await JobScheduler.remove('file-writer-scheduler')
```

`JobScheduler` also provides additional methods to manage scheduled jobs, such as `clear`, `list`, `find` and `exists`. You can use these methods to manage your scheduled jobs effectively.

## Flows

Flows allow you to create complex job workflows with parent-child relationships. This is useful for orchestrating multiple jobs that depend on each other. 

Make sure to check the [BullMQ documentation](https://docs.bullmq.io/guide/flows) for more details on flows.

### Bulk Dispatching

You can dispatch multiple jobs at once using the `BulkDispatcher`

```typescript
// Send welcome emails to multiple new users
const newUsers = await User
  .query()
  .where('welcome_email_sent', false)

await new BulkDispatcher(
  newUsers.map(user => 
    SendWelcomeEmailJob.dispatch({
      userId: user.id,
      email: user.email,
      name: user.fullName
    })
  )
).dispatch()
```

## Job Chains

Execute jobs sequentially where each job depends on the previous one:

```typescript
import { JobChain } from '@nemoventures/adonis-jobs'

await new JobChain([
  ProcessOrderJob.dispatch({ orderId: '123' }),
  SendConfirmationEmailJob.dispatch({ orderId: '123' }),
  UpdateInventoryJob.dispatch({ orderId: '123' }),
]).dispatch()
```

If any job in the chain fails, subsequent jobs won't be executed.

## Job Flows

Create complex workflows with parent-child relationships:

```typescript
import { JobFlow } from '@nemoventures/adonis-jobs'

const parentJob = ProcessOrderJob.dispatch({ orderId: '123' })
const flow = new JobFlow(parentJob)

// Add child jobs that run after parent completes
flow.addChildJob(SendEmailJob.dispatch({ orderId: '123' }))
flow.addChildJob(UpdateInventoryJob.dispatch({ orderId: '123' }))

// Add nested children
flow.addChildJob(
  GenerateInvoiceJob.dispatch({ orderId: '123' }),
  (childFlow) => {
    childFlow.addChildJob(EmailInvoiceJob.dispatch({ orderId: '123' }))
  }
)

await flow.dispatch()
```

## Next Steps

Learn how to set up [job scheduling](/guides/job-scheduling) for recurring tasks and cron-like functionality.
