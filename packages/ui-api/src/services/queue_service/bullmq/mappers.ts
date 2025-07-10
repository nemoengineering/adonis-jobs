import { DateTime } from 'luxon'
import type { BullJob, JobState } from '@nemoventures/adonis-jobs/types'

import { JobStatus, type JobRun } from '../types.js'

export function remapJobState(bullJobStatus: JobState | string): JobStatus {
  switch (bullJobStatus) {
    case 'active':
      return JobStatus.Active
    case 'failed':
      return JobStatus.Failed
    case 'paused':
      return JobStatus.Paused
    case 'delayed':
      return JobStatus.Delayed
    case 'completed':
      return JobStatus.Completed
    case 'prioritized':
      return JobStatus.Waiting
    case 'waiting':
    case 'waiting-children':
      return JobStatus.Waiting
    default:
      return JobStatus.Unknown
  }
}

export function remapJobStatus(jobStatus: JobStatus): JobState {
  switch (jobStatus) {
    case JobStatus.Active:
      return 'active'
    case JobStatus.Failed:
      return 'failed'
    case JobStatus.Paused:
      return 'paused'
    case JobStatus.Delayed:
      return 'delayed'
    case JobStatus.Completed:
      return 'completed'
    case JobStatus.Waiting:
      return 'wait'
    default:
      throw new Error(`Unknown job status: ${jobStatus}`)
  }
}

export class BullmqPresenter {
  static #toIsoString(timestamp?: number): string | undefined {
    if (!timestamp) return

    return DateTime.fromMillis(timestamp).toISO() ?? undefined
  }

  static async remapJob(options: {
    job: BullJob
    queueName: string
    logs?: string[]
  }): Promise<JobRun> {
    const { job, queueName } = options

    const startedAt = this.#toIsoString(job.processedOn)
    const completedAt = this.#toIsoString(job.finishedOn)
    const failedAt = job.failedReason ? this.#toIsoString(job.finishedOn) : undefined

    let duration: number | undefined

    if (job.processedOn && job.finishedOn) {
      duration = job.finishedOn - job.processedOn
    }

    // Detect if job is part of a flow
    const isFlowJob = !!(job.parent || job.opts?.parent)
    const isRootJob = !job.parent?.id
    const flowId = job.parent?.id || job.opts?.parent?.id

    return {
      id: job.id?.toString() || 'unknown',
      name: job.name,
      queueName,
      status: remapJobState(await job.getState()),
      data: job.data || {},
      startedAt,
      completedAt,
      failedAt,
      duration,
      attempts: job.attemptsMade || 0,
      maxAttempts: job.opts?.attempts || 1,
      progress: job.progress ? { percentage: job.progress as number } : undefined,
      error: job.failedReason
        ? { message: job.failedReason, stack: job.stacktrace?.[0] }
        : undefined,

      returnValue: job.returnvalue,
      createdAt: job.timestamp ? this.#toIsoString(job.timestamp)! : this.#toIsoString()!,
      processedAt: job.processedOn ? this.#toIsoString(job.processedOn) : undefined,
      logs: options.logs || [],

      // Flow metadata
      isFlowJob,
      isRootJob,
      flowId: flowId?.toString(),
      flowKey: job.opts?.parent?.queue || undefined,
      parentJobId: job.parent?.id?.toString(),
      parentKey: job.parentKey || undefined,
    }
  }
}
