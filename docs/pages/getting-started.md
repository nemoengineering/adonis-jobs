# Getting Started

## Overview

## Installation

Install and configure the `@nemoengineering/adonis-jobs` package using the following command:

```shell
node ace add @nemoengineering/adonis-jobs
```

::: details Manual Installation

1. Installs the `@nemoengineering/adonis-jobs` package using the detected package manager.
2. Run the package configuration command:

```shell
node ace configure @nemoengineering/adonis-jobs
```

:::

## Configuration

Ensure that a connection to a Redis instance is available to the application and correctly configured through the
environment variables:

```shell
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=my-redis-password
```

Upon installation, all jobs are dispatched on the `default` queue.

## Generating Job Classes

By default, all of the queueable jobs for your application are stored in the `app/jobs` directory. If the `app/jobs`
directory doesn't exist, it will be created when you run the `make:job` Ace command:

```shell
node ace make:job process_invoice
```

Job classes are very simple, normally containing only a `process` method that is invoked when the job is processed by
the queue.

```typescript {6-7}
import {Job} from '@nemoengineering/adonis-jobs'

export default class ProcessInvoice extends Job<{ invoiceId: string }, void> {

  async process(): Promise<void> {
    logger.info(`Processing invoice ${this.job.data.invoiceId}!`)
    // Code to process the invoice...
  }

}
```

## Dispatching Jobs

Once you have written your job class, you may dispatch it using the dispatch method on the job itself. The arguments
passed to the dispatch method will be given to the job's `data` property:

```typescript
ProcessInvoice.dispatch({invoiceId: "HDW34312358"})
```

## Running the Queue Worker

This package includes an Ace command that will start a queue worker and process new jobs as they are pushed onto the
queue. You may run the worker using the `queue:work` Ace command. Note that once the `queue:work` command has started,
it will continue to run until it is manually stopped or you close your terminal:

```shell
node ace queue:work
```
