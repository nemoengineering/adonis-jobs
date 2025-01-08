<div align="center">
  <h2><b>Adonis Jobs</b></h2>
  <p>Job queues for your AdonisJS applications</p>
</div>


## **Pre-requisites**
The `@nemoventures/adonis-jobs` package requires `@adonisjs/core >= 6.2.0`


## **Setup**

Install the package from the npm registry as follows.

```
npm i @nemoventures/adonis-jobs
# or
yarn add @nemoventures/adonis-jobs
```

Next, configure the package by running the following ace command.

```
node ace configure @nemoventures/adonis-jobs
```

And then add the path to the `package.json`

```json
{
  "name": "adonis-app",
  "version": "0.0.0",
  "imports": {
    ...
    "#jobs/*": "./app/jobs/*.js"
  },
  ...
}
```
# Usage

## Creating a job

To create a new job run `node ace make:job <job name>`. The `process` method implements the work the job should do.

E.g. `node ace make:job concat` will result in the following job to be created

```typescript
import { Job } from '@nemoventures/adonis-jobs'

export type ConcatJobData = { name: [string, string] }

export type ConcatJobReturn = { fullName: string }

export default class ConcatJob extends Job<ConcatJobData, ConcatJobReturn> {
  async process(): Promise<ConcatJobReturn> {
    return { fullName: this.data.name.join(' ') }
  }
}
```

You can use `@inject()` to on the constructor or methods like would expect in AdonisJS.

## Dispatching a job

A job can be dispatched and handled in the background, or you can wait for the result of the job.

```typescript
import ConcatJob from '#jobs/concat_job'
import { BulkDispatcher, JobChain } from '@nemoventures/adonis-jobs'

// Dispatch a job
await ConcatJob.dispatch({ name: ["Albert", "Einstein"] })

// Dispatch and wait for result
const { fullName } = await ConcatJob.dispatch({ name: ["Albert", "Einstein"] }).waitResult()

// Dispach with retry
await ConcatJob.dispatch({ name: ["Albert", "Einstein"] })
  .with('attempts', 10)
  .with('backoff', {
    type: 'exponential',
    delay: 1000,
  })


// Dispatch jobs in bulk
await new BulkDispatcher([
  ConcatJob.dispatch({ name: ["Albert", "Einstein"] }),
  ConcatJob.dispatch({ name: ['Marie', 'Curie'] })
]).dispatch()

// Dispatch a sequential jon chain
await new JobChain([
  ConcatJob.dispatch({ name: ["Albert", "Einstein"] }),
  ConcatJob.dispatch({ name: ['Marie', 'Curie'] })
]).dispatch()
```

## Queues

By default, all jobs are dispatched on the default queue. You can add more queues in the `config/queue.ts` file.
Also, you can sed default queue / worker settings here.

```typescript
const queueConfig = defineConfig({
  defaultQueue: 'default',
  queues: {
    default: {},
    priority: {
      globalConcurrency: 20,
      defaultWorkerOptions: {
        removeOnComplete: { age: string.seconds.parse('3 days') },
        removeOnFail: { age: string.seconds.parse('7 days') },
      },
    },
  }
})
```

### Dispatch a job on a different queue

You can send a job to a different queue using `onQueue`.

```typescript
await ConcatJob.dispatch({ name: ["Albert", "Einstein"] }).onQueue("priority")
```

Or you can set the default queue for a specific job in the class.

```typescript
export default class ConcatJob extends Job<ConcatJobData, ConcatJobReturn> {
  static defaultQueue: keyof Queues = 'priority'
  ...
}
```


## Dispatching a job flow

Use `JobFlow` to start a flow job. Read more about flow jobs in the [BullMQ docs](https://docs.bullmq.io/guide/flows).

```typescript
import { JobFlow } from '@nemoventures/adonis-jobs'

const flow = new JobFlow(await RenovateInterior.dispatch({ name: ["Albert", "Einstein"] }))

flow.addChildJob(RenovateJob.dispatch({ place: 'ceiling' }))
flow.addChildJob(RenovateJob.dispatch({ place: 'floor' }))

// Add children to this child
flow.addChildJob(RenovateJob.dispatch({ place: 'walls' }), childFlow => {
  childFlow.addChildJob(RenovateJob.dispatch({ place: 'doors' }))
})

await flow.dispatch()

```

## Running a repeated job

You can dispatch a repeated job which automatically runs on the specified schedule. Read more about repeated jobs in the [BullMQ docs](https://docs.bullmq.io/guide/jobs/repeatable)

```typescript
// Dispatch a repeated job
await ConcatJob.dispatch({ name: ["Albert", "Einstein"] }).with('repeat', { pattern: '0 2 * * 0' })
```

## Closure job (experimental)
Sometimes it is useful to not have to create a job class to do some async work. A closure job can be defined anywhere and sent to a worker.

Important to note is that if you want to pass arguments to a closure job they must be json serializable and need to be passed to the closure dispatch.

```typescript
import ClosureJob from '@nemoventures/adonis-jobs/builtin/closure_job'

ClosureJob.dispatch(
  class extends Closure {
    async run(numberA: number, numberB: number) {
      // never reference variables outside the closure class here
      // they always should be passed as arguments
      const { default: app } = await this.import<typeof import('@adonisjs/core/services/app')>('@adonisjs/core/services/app')

      const calculator = await app.app.container.make('calculator')
      calculator.add(numberA, numberB)
    }
  },
  
  // arguments for numberA and numberB in the closure
  1, 2
)
```

## Handling errors

To react on a failing job you can overwrite the `onFailed` method on the job class.

```typescript
import { Job } from '@nemoventures/adonis-jobs'

export type ConcatJobData = { name: [string, string] }

export type ConcatJobReturn = { fullName: string }

export default class ConcatJob extends Job<ConcatJobData, ConcatJobReturn> {

  async process(): Promise<ConcatJobReturn> {
    if (this.data.name.length === 0) {
      // this fails the job and skips retries
      this.fail("Must input a name")
    }
    
    return { fullName: this.data.name.join(' ') }
  }

  async onFailed() {
    this.logger.error({error: this.error}, 'concat has failed')
    if (this.allAttemptsMade()) {
      // e.g. notify user
    }
  }
}
```

## Running a Job Worker

To execute the dispatched Jobs run `node ace queue:work`


## Job dashboard

This package ships with [queuedash](https://www.queuedash.com/). To use it you need to register the routes in your `start/routes.ts`

```typescript
router.group(() => {
  queueUiRoutes().prefix('/queue')
}).prefix("/admin")
```
