<div align="center">
  <h2><b>Adonis Jobs</b></h2>
  <p>Job queues for your AdonisJS applications</p>
</div>

## About

A powerful and type-safe job queue system for AdonisJS 6 applications. Built on top of BullMQ, it provides a clean API for managing background jobs, scheduled tasks, and complex job workflows.

**Features:**
- Clean BullMQ Integration
- Dedicated Ace commands for job management
- Scheduled and delayed job execution
- Flows: chains and complex workflows
- Observability with built-in metrics and Opentelemetry support
- QueueDash integration

## Documentation

> [!TIP]
> For complete documentation, examples, and guides, visit: **[https://adonis-jobs.nemo.engineering](https://adonis-jobs.nemo.engineering)**

## Quick Start

```bash
node ace configure @nemoventures/adonis-jobs
```

Create your first job:

```typescript
import { Job } from '@nemoventures/adonis-jobs'

type SendEmailJobData = {
  email: string
  subject: string
}

export default class SendEmailJob extends Job<SendEmailJobData, void> {
  async process(): Promise<void> {
    // Send email logic here
  }
}
```

Dispatch it:

```typescript
await SendEmailJob.dispatch({ 
  email: 'user@example.com', 
  subject: 'Welcome!' 
})
```

And run your worker:

```bash
node ace queue:work
```

## License

MIT

