<div align="center">
  <h2><b>Adonis Jobs</b></h2>
  <p>Job queues for your AdonisJS applications</p>
</div>


## **Pre-requisites**
The `@nemoengineering/jobs` package requires `@adonisjs/core >= 6.2.0`


## **Setup**

Install the package from the npm registry as follows.

```
npm i @nemoengineering/jobs
# or
yarn add @nemoengineering/jobs
```

Next, configure the package by running the following ace command.

```
node ace configure @nemoengineering/jobs
```

And then add the path to the `tsconfig.json`

```json
{
  "extends": "@adonisjs/tsconfig/tsconfig.app.json",
  "compilerOptions": {
    "resolveJsonModule": true,
    "rootDir": "./",
    "outDir": "./build",
    "paths": {
     ...
      "#jobs/*": ["./app/jobs/*.js"]
    }
  }
}
```

and `package.json`

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
import { Job } from '@nemoengineering/jobs'
import { WorkerOptions } from '@nemoengineering/jobs/types'

export type ConcatJobData = { name: [string, string] }

export type ConcatJobReturn = { fullName: string }

export default class ConcatJob extends Job<ConcatJobData, ConcatJobReturn> {
  static workerOptions: WorkerOptions = {}

  async process(): Promise<ConcatJobReturn> {
    return { fullName: this.job.data.name.join(' ') }
  }
}
```

You can use `@inject()` to on the constructor or methods like would expect in AdonisJS.

## Dispatching a job

A job can be dispatched and handled in the background, or you can wait for the result of the job.

```typescript
import jobs from '@nemoengineering/jobs/services/main'

// Dispatch a asynchonous job
await jobs.use('concat').dispatch('concat-name', { name: ["Albert", "Einstein"] })

// Dispatch and wait for result
const { fullName } = await jobs.use('concat').dispatchAndWaitResult('concat-name', { name: ["Albert", "Einstein"] })

// Dispatching many jobs
await jobs.use('concat').dispatchMany([
  { name: 'concat-einstein', data: { name: ['Albert', 'Einstein'] } },
  { name: 'concat-curie', data: { name: ['Marie', 'Curie'] } },
])
```

## Dispatching a job flow

Use the `dispatchFlow` to start a flow job. Read more about flow jobs in the [BullMQ docs](https://docs.bullmq.io/guide/flows).

```typescript
import jobs from '@nemoengineering/jobs/services/main'

await jobs.dispatchFlow().add({
  name: 'renovate-interior',
  queueName: 'renovate',
  children: [
    { name: 'paint', data: { place: 'ceiling' }, queueName: 'steps' },
    { name: 'paint', data: { place: 'walls' }, queueName: 'steps' },
    { name: 'fix', data: { place: 'floor' }, queueName: 'steps' },
  ],
});
```

## Running a repeated job

You can dispatch a repeated job which automatically runs on the specified schedule. Read more about repeated jobs in the [BullMQ docs](https://docs.bullmq.io/guide/jobs/repeatable)

```typescript
import jobs from '@nemoengineering/jobs/services/main'

// Dispatch a repeated job
await jobs.use('concat').dispatch(
  'concat-name',
  { name: ['Albert', 'Einstein'] },
  {
    repeat: {
      pattern: '0 15 3 * * *',
    },
  }
)
```

## Handling errors

To react on a failing job you can overwrite the `onFailed` method on the job class.

```typescript
import { Job } from '@nemoengineering/jobs'
import { WorkerOptions } from '@nemoengineering/jobs/types'

export type ConcatJobData = { name: [string, string] }

export type ConcatJobReturn = { fullName: string }

export default class ConcatJob extends Job<ConcatJobData, ConcatJobReturn> {
  static workerOptions: WorkerOptions = {}

  async process(): Promise<ConcatJobReturn> {
    return { fullName: this.job.data.name.join(' ') }
  }

  async onFailed() {
    console.log('concat has failed', this.error)
  }
}
```

