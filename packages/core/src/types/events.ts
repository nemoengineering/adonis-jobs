import type { BullJob, BullJobNode } from './bull.js'

type EventWithJob = { job: BullJob }

type EventWithManyJobs = { jobs: BullJob[] }

type EventWithFlow = { flow: BullJobNode }

export type JobEvents = {
  'job:dispatched': EventWithJob
  'job:dispatched:many': EventWithManyJobs
  'job:dispatched:chain': EventWithFlow
  'job:dispatched:flow': EventWithFlow
  'job:started': EventWithJob
  'job:success': EventWithJob
  'job:error': EventWithJob & { error: Error }
  'job:failed': EventWithJob & { error: Error }
}
