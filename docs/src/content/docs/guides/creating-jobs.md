---
title: Creating Jobs
description: Learn how to create and structure jobs in @nemoventures/adonis-jobs
---

Jobs are the core building blocks of your queue system. They encapsulate the work that needs to be done in the background.

## Generate a Job

Use the Ace command to create a new job:

```bash
node ace make:job send_email
```

This creates a job file at `app/jobs/send_email_job.ts`:

```typescript
import { Job } from '@nemoventures/adonis-jobs'

/**
 * Here you can define the data type your job expects.
 */
export type SendEmailJobData = {
  to: string
  subject: string
  template: string
  variables: Record<string, any>
}

/**
 * Then you can also define the return type of your job.
 */
export type SendEmailJobReturn = {
  messageId: string
  success: boolean
}

export default class SendEmailJob extends Job<SendEmailJobData, SendEmailJobReturn> {
  async process(): Promise<SendEmailJobReturn> {
    const { to, subject, template, variables } = this.data
    
    // Send email logic here
    const messageId = await sendEmail({ to, subject, template, variables })
    
    return { messageId, success: true }
  }
}
```

## Dependency Injection

You can inject dependencies with the `@inject()` decorator in your job classes and methods like you would expect in AdonisJS.

```typescript
import { inject } from '@adonisjs/core'
import { Job } from '@nemoventures/adonis-jobs'
import MailService from '#services/mail_service'

export type SendEmailJobData = {
  to: string
  subject: string
  body: string
}

@inject()
export default class SendEmailJob extends Job<SendEmailJobData, void> {
  constructor(private mailService: MailService) {
    super()
  }

  @inject()
  async process(anotherService: AnotherService): Promise<void> {
    await this.mailService.send(this.data)
    await anotherService.doSomething(this.data)
  }
}
```

### Job Properties

Your job has access to several properties:

```typescript
export default class SendEmailJob extends Job<SendEmailJobData, SendEmailJobReturn> {
  async process(): Promise<SendEmailJobReturn> {
    // Job data passed during dispatch
    const emailData = this.data
    
    // BullMQ Job instance
    const jobId = this.job
    
    // BullMQ Worker instance
    const worker = this.worker
    
    // Logger instance
    this.logger.info('Processing email job', { to: emailData.to })
    
    return { messageId: 'abc123', success: true }
  }
}
```

## Default Queue

Set a default queue for a job class:

```typescript
import { Queues } from '@nemoventures/adonis-jobs/types'

export default class SendEmailJob extends Job<SendEmailJobData, void> {
  static defaultQueue: keyof Queues = 'emails'

  async process(): Promise<void> {
    // Job logic
  }
}
```

Now all instances of this job will use the `emails` queue unless overridden during dispatch.

## Default Options

Set default BullMQ options for a job class to avoid repeating them every time you dispatch:

```typescript
import { Job } from '@nemoventures/adonis-jobs'
import type { BullJobsOptions } from '@nemoventures/adonis-jobs/types'

export default class SendEmailJob extends Job<void, void> {
  static options: BullJobsOptions = {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 10,
    removeOnFail: 50,
  }

  async process(): Promise<void> {
    // Job logic
  }
}
```

Now you can dispatch the job without having to specify options every time:

```typescript
// These options will be automatically applied
await SendEmailJob.dispatch(data)

// You can still override specific options if needed when dispatching
await SendEmailJob.dispatch(data)
  .with('attempts', 3)
  .with('delay', 5000)
```

The `.with()` method will merge with and override the default options.

## Error Handling

### Failing Jobs

Explicitly fail a job to skip retries:

```typescript
export default class ProcessPaymentJob extends Job<PaymentData, void> {
  async process(): Promise<void> {
    if (!this.data.paymentMethodId) {
      this.fail('Payment method ID is required')
      return
    }

    // Process payment
  }
}
```

Calling `this.fail()` will throw an `UnrecoverableError`. In this case, BullMQ will move the job to the failed state and will not retry it.

See [the BullMQ documentation](https://docs.bullmq.io/patterns/stop-retrying-jobs) for more details.

### Handling Failures

Override the `onFailed` method to handle job failures:

```typescript
export default class SendEmailJob extends Job<SendEmailJobData, void> {
  async process(): Promise<void> {
    // Email sending logic that might fail
  }

  async onFailed(): Promise<void> {
    this.logger.error({ err: this.error }, 'Email job failed')

    // Check if all attempts have been exhausted
    if (this.allAttemptsMade()) {
      await this.notifyAdministrators()
    }
  }
}
```

## Job Discovery

Jobs can be placed anywhere in your codebase. The only requirement is that they:
- End with `_job.ts` suffix
- Export a default class extending `Job`

```
✅ app/jobs/send_email_job.ts
✅ app/jobs/process_payment_job.ts
✅ app/jobs/generate_report_job.ts

❌ app/jobs/send_email.ts
❌ app/jobs/email_sender.ts
```

The package will automatically discover all job files in your codebase, so you don't need to register them manually. What will happen in the background when dispatching a job is that the package will store the job class name in Redis, and when processing the job, it will dynamically import the job file based on the class name.

One caveat of this approach is that if you rename a Job class name (not the file path), and you have already dispatched jobs in the queue, those jobs will fail to process because the package will not be able to find the job class. 

To avoid this, you can set the `nameOverride` property in the job class:

```typescript
/**
 * Let's say this class was previously named `SendEmailJob` and you 
 * renamed it to `SendEmailNotificationJob`.
 */
export default class SendEmailNotificationJob extends Job<SendEmailJobData, void> {
  // This will allow the previously dispatched jobs to be processed correctly
  static nameOverride = 'SendEmailJob' 

  async process(): Promise<void> {
    // Job logic
  }
}
```

## Next Steps

Now that you know how to create jobs, learn how to [dispatch them](/guides/dispatching-jobs) to your queues.
