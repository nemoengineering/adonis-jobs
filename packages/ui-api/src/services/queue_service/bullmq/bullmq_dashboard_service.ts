import queueManager from '@nemoventures/adonis-jobs/services/main'

import { JobStatus, QueueStatus } from '../types.js'
import { JobRunsRepository } from './job_runs_repository.js'
import { BullmqPresenter, remapJobStatus } from './mappers.js'
import { FlowJobsRepository } from './flow_jobs_repository.js'
import type { QueueListResponse, QueueService } from '../main.js'
import type { GetJobRunsValidator } from '#validators/dashboard_validator'
import type {
  JobRun,
  JobRunsResponse,
  GlobalStats,
  PerformanceMetrics,
  DashboardOverview,
  ScheduleListResponse,
  DispatchJobRequest,
  DispatchJobResponse,
  AvailableJobResponse,
} from '../types.js'

export class BullmqDashboardService implements QueueService {
  #jobRunsRepository = new JobRunsRepository()
  #flowJobsRepository = new FlowJobsRepository()

  /**
   * Calculates global statistics across all queues
   */
  async getGlobalStats(): Promise<GlobalStats> {
    const queueNames = this.#getQueueNames()

    let totalJobs = 0
    let activeJobs = 0
    let completedJobs = 0
    let failedJobs = 0
    let waitingJobs = 0
    let delayedJobs = 0
    let pausedJobs = 0

    for (const queueName of queueNames) {
      const queue = queueManager.useQueue(queueName as any)

      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
        queue.getJobs(['paused']),
      ])

      waitingJobs += waiting.length
      activeJobs += active.length
      completedJobs += completed.length
      failedJobs += failed.length
      delayedJobs += delayed.length
      pausedJobs += paused.length
    }

    totalJobs = waitingJobs + activeJobs + completedJobs + failedJobs + delayedJobs + pausedJobs

    return {
      totalQueues: queueNames.length,
      totalJobs,
      activeJobs,
      completedJobs,
      failedJobs,
      waitingJobs,
      delayedJobs,
      pausedJobs,
    }
  }

  /**
   * Calculates performance metrics and rates
   */
  async #getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const queueNames = this.#getQueueNames()
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const oneMinute = 60 * 1000

    let totalJobsLastHour = 0
    let totalJobsLastMinute = 0
    let totalProcessingTime = 0
    let processedJobsCount = 0
    let totalSuccessfulJobs = 0
    let totalFailedJobs = 0

    for (const queueName of queueNames) {
      const queue = queueManager.useQueue(queueName as any)

      const [recentCompleted, recentFailed] = await Promise.all([
        queue.getJobs([JobStatus.Completed], 0, 100),
        queue.getJobs([JobStatus.Failed], 0, 100),
      ])

      const allRecentJobs = [...recentCompleted, ...recentFailed]

      const jobsLastHour = allRecentJobs.filter(
        (job) => job.timestamp && now - job.timestamp <= oneHour,
      )
      totalJobsLastHour += jobsLastHour.length

      const jobsLastMinute = allRecentJobs.filter(
        (job) => job.timestamp && now - job.timestamp <= oneMinute,
      )
      totalJobsLastMinute += jobsLastMinute.length

      const completedWithDuration = recentCompleted.filter(
        (job) => job.processedOn && job.finishedOn,
      )

      for (const job of completedWithDuration) {
        if (job.processedOn && job.finishedOn) {
          totalProcessingTime += job.finishedOn - job.processedOn
          processedJobsCount++
        }
      }

      totalSuccessfulJobs += recentCompleted.length
      totalFailedJobs += recentFailed.length
    }

    const averageProcessingTime =
      processedJobsCount > 0 ? totalProcessingTime / processedJobsCount : 0
    const totalJobs = totalSuccessfulJobs + totalFailedJobs
    const successRate = totalJobs > 0 ? (totalSuccessfulJobs / totalJobs) * 100 : 0
    const errorRate = totalJobs > 0 ? (totalFailedJobs / totalJobs) * 100 : 0

    return {
      jobsPerSecond: totalJobsLastMinute / 60,
      jobsPerMinute: totalJobsLastMinute,
      jobsPerHour: totalJobsLastHour,
      averageWaitTime: 0,
      averageProcessingTime,
      successRate,
      errorRate,
    }
  }

  /**
   * Retrieves recent activity including jobs and errors
   */
  async #getRecentActivity() {
    const queueNames = this.#getQueueNames()

    const recentJobs: Array<DashboardOverview['recentActivity']['recentJobs'][number]> = []
    const recentErrors: Array<DashboardOverview['recentActivity']['recentErrors'][number]> = []

    for (const queueName of queueNames) {
      const queue = queueManager.useQueue(queueName as any)

      const [completed, failed, active] = await Promise.all([
        queue.getJobs([JobStatus.Completed], 0, 5),
        queue.getJobs([JobStatus.Failed], 0, 5),
        queue.getJobs([JobStatus.Active], 0, 5),
      ])

      for (const job of [...completed, ...active]) {
        recentJobs.push({
          id: job.id?.toString() || 'unknown',
          name: job.name,
          queueName: queue.name,
          status: job.finishedOn ? JobStatus.Completed : JobStatus.Active,
          timestamp: job.timestamp
            ? new Date(job.timestamp).toISOString()
            : new Date().toISOString(),
        })
      }

      for (const job of failed) {
        const error = job.failedReason || 'Unknown error'
        recentErrors.push({
          jobId: job.id?.toString() || 'unknown',
          jobName: job.name,
          queueName: queue.name,
          error,
          timestamp: job.timestamp
            ? new Date(job.timestamp).toISOString()
            : new Date().toISOString(),
        })
      }
    }

    recentJobs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    recentErrors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return { recentJobs: recentJobs.slice(0, 10), recentErrors: recentErrors.slice(0, 10) }
  }

  /**
   * Builds complete dashboard data including stats, metrics and recent activity
   */
  async getOverview(): Promise<DashboardOverview> {
    const [globalStats, performanceMetrics, recentActivity] = await Promise.all([
      this.getGlobalStats(),
      this.#getPerformanceMetrics(),
      this.#getRecentActivity(),
    ])

    return { globalStats, performanceMetrics, recentActivity }
  }

  /**
   * Retrieves list of queues with their statistics
   */
  async getQueues(): Promise<QueueListResponse> {
    const queueNames = this.#getQueueNames()
    const queues = []

    for (const queueName of queueNames) {
      const queue = queueManager.useQueue(queueName as any)

      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
        queue.getJobs(['paused']),
      ])

      const isPaused = await queue.isPaused()

      const concurrency = (await queue.getGlobalConcurrency()) || 1

      queues.push({
        name: queueName,
        status: isPaused ? QueueStatus.Paused : QueueStatus.Active,
        stats: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
          paused: paused.length,
        },
        isPaused,
        concurrency,
      })
    }

    return { queues }
  }

  /**
   * Pauses or resumes a queue
   */
  async toggleQueuePause(options: { queueName: string; pause: boolean }) {
    const queue = queueManager.useQueue(options.queueName as any)

    if (options.pause) {
      await queue.pause()
    } else {
      await queue.resume()
    }
  }

  /**
   * Retrieves list of job schedulers with their information
   */
  async getSchedules(): Promise<ScheduleListResponse> {
    const queueNames = this.#getQueueNames()
    const schedules = []

    for (const queueName of queueNames) {
      const queue = queueManager.useQueue(queueName as any)

      const repeatableJobs = await queue.getRepeatableJobs()

      for (const repeatableJob of repeatableJobs) {
        schedules.push({
          id: repeatableJob.id || `${queueName}-${Date.now()}`,
          name: repeatableJob.name || 'Unnamed Schedule',
          queueName,
          pattern: repeatableJob.pattern || undefined,
          every: repeatableJob.every ? Number.parseInt(repeatableJob.every) : undefined,
          status: QueueStatus.Active,
          nextRunAt: repeatableJob.next ? new Date(repeatableJob.next).toISOString() : undefined,
          lastRunAt: undefined,
          jobTemplate: { name: repeatableJob.name, data: {}, opts: {} },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    }

    return { schedules }
  }

  /**
   * Gets list of queue names from configuration
   */
  #getQueueNames(): string[] {
    return Object.keys(queueManager.config.queues)
  }

  /**
   * Retrieves paginated list of job executions with filtering and sorting
   */
  async getJobRuns(options: GetJobRunsValidator): Promise<JobRunsResponse> {
    return this.#jobRunsRepository.getJobRuns(options)
  }

  async getAvailableJobs(): Promise<AvailableJobResponse> {
    const jobClasses = await queueManager.getAvailableJobs()
    const queueNames = this.#getQueueNames()

    return jobClasses.map((jobClass) => ({
      name: jobClass.jobName,
      defaultQueue: jobClass.defaultQueue || queueNames[0],
    }))
  }

  async dispatchJob(options: DispatchJobRequest): Promise<DispatchJobResponse> {
    const { jobName, queueName, data } = options

    const availableJobs = await queueManager.getAvailableJobs()
    const jobClass = availableJobs.find((job) => job.jobName === jobName)

    if (!jobClass) throw new Error(`Job "${jobName}" not found`)

    const queueNames = this.#getQueueNames()
    if (!queueNames.includes(queueName)) throw new Error(`Queue "${queueName}" not found`)

    const queue = queueManager.useQueue(queueName as any)
    const bullJob = await queue.add(jobName, data)

    return {
      jobId: bullJob.id?.toString() || 'unknown',
      message: `Job "${jobName}" dispatched successfully to queue "${queueName}"`,
    }
  }

  /**
   * Retrieves a specific job by its ID across all queues
   */
  async getJobById(options: { jobId: string }): Promise<JobRun | null> {
    const queueNames = this.#getQueueNames()

    for (const queueName of queueNames) {
      const queue = queueManager.useQueue(queueName as any)

      const job = await queue.getJob(options.jobId).catch(() => null)
      if (job) {
        const logs = await queue.getJobLogs(job.id as string).catch(() => [])
        return await BullmqPresenter.remapJob({
          job,
          queueName,
          logs: 'logs' in logs ? logs.logs : [],
        })
      }
    }

    return null
  }

  /**
   * Retrieves all jobs in a flow tree starting from any job ID
   */
  async getFlowJobsFromJobId(jobId: string): Promise<JobRun[] | null> {
    return await this.#flowJobsRepository.getFlowJobsFromJobId(jobId)
  }

  /**
   * Retry a failed job
   */
  async retryJob(options: { jobId: string }): Promise<{ success: boolean; message: string }> {
    const queueNames = this.#getQueueNames()

    for (const queueName of queueNames) {
      const queue = queueManager.useQueue(queueName as any)
      const job = await queue.getJob(options.jobId).catch(() => null)

      if (!job) continue

      try {
        await job.retry()
        return { success: true, message: `Job ${options.jobId} has been queued for retry` }
      } catch (error) {
        return { success: false, message: `Failed to retry job: ${error.message}` }
      }
    }

    return { success: false, message: `Job ${options.jobId} not found` }
  }

  /**
   * Rerun a job (create a new instance with same data)
   */
  async rerunJob(options: {
    jobId: string
  }): Promise<{ success: boolean; message: string; newJobId?: string }> {
    const queueNames = this.#getQueueNames()

    for (const queueName of queueNames) {
      const queue = queueManager.useQueue(queueName as any)
      const job = await queue.getJob(options.jobId).catch(() => null)
      if (!job) continue

      try {
        const newJob = await queue.add(job.name, job.data, {
          ...job.opts,
          jobId: undefined,
          delay: 0,
        })

        return {
          success: true,
          message: `Job ${job.name} has been rerun successfully`,
          newJobId: newJob.id?.toString(),
        }
      } catch (error) {
        return { success: false, message: `Failed to rerun job: ${error.message}` }
      }
    }

    return { success: false, message: `Job ${options.jobId} not found` }
  }

  /**
   * Remove a job from the queue
   */
  async removeJob(options: { jobId: string }): Promise<{ success: boolean; message: string }> {
    const queueNames = this.#getQueueNames()

    for (const queueName of queueNames) {
      const queue = queueManager.useQueue(queueName as any)
      const job = await queue.getJob(options.jobId).catch(() => null)

      if (!job) continue

      try {
        await job.remove()
        return { success: true, message: `Job ${options.jobId} has been removed successfully` }
      } catch (error) {
        return { success: false, message: `Failed to remove job: ${error.message}` }
      }
    }

    return { success: false, message: `Job ${options.jobId} not found` }
  }

  /**
   * Clean a queue by removing jobs with specific statuses
   */
  async cleanQueue(options: {
    queueName: string
    statuses?: JobStatus[]
  }): Promise<{ success: boolean; message: string }> {
    const queue = queueManager.useQueue(options.queueName as any)

    if (!options.statuses?.length) {
      options.statuses = [
        JobStatus.Completed,
        JobStatus.Failed,
        JobStatus.Active,
        JobStatus.Waiting,
        JobStatus.Delayed,
        JobStatus.Paused,
      ]
    }

    let totalCleaned = 0
    const cleanPromises = options.statuses.map(async (jobStatus) => {
      const bullMQStatus = remapJobStatus(jobStatus)
      const cleaned = await queue.clean(0, 0, bullMQStatus)
      return cleaned.length || 0
    })

    const cleanedCounts = await Promise.all(cleanPromises)
    totalCleaned = cleanedCounts.reduce((sum, count) => sum + count, 0)

    return {
      success: true,
      message: `Queue ${options.queueName} cleaned successfully. ${totalCleaned} jobs removed.`,
    }
  }
}
