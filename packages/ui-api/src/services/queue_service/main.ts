import type { GetJobRunsValidator } from '#validators/dashboard_validator'
import type {
  AvailableJobResponse,
  DashboardOverview,
  DispatchJobRequest,
  DispatchJobResponse,
  GlobalStats,
  JobRun,
  JobRunsResponse,
  JobStatus,
  QueueStatus,
  ScheduleListResponse,
} from './types.js'

export interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
}

export interface QueueInfo {
  name: string
  status: QueueStatus
  stats: QueueStats
  isPaused: boolean
  concurrency: number
}

export interface QueueListResponse {
  queues: QueueInfo[]
}

export abstract class QueueService {
  /**
   * Get data needed for the global overview dashboard
   */
  abstract getOverview(): Promise<DashboardOverview>

  /**
   * Dispatch a single job
   */
  abstract dispatchJob(request: DispatchJobRequest): Promise<DispatchJobResponse>

  /**
   * Get a list of available jobs that can be dispatched
   */
  abstract getAvailableJobs(): Promise<AvailableJobResponse>

  /**
   * Get history of jobs runs with pagination and filtering options
   */
  abstract getJobRuns(options: GetJobRunsValidator): Promise<JobRunsResponse>

  /**
   * Toggle pause/resume state of a queue
   */
  abstract toggleQueuePause(request: { queueName: string; pause: boolean }): Promise<void>

  /**
   * Calculate global statistics for the dashboard
   */
  abstract getGlobalStats(): Promise<GlobalStats>

  /**
   * Get a list of queues with their statistics
   */
  abstract getQueues(): Promise<{ queues: QueueInfo[] }>

  /**
   * Get a list of job schedules
   */
  abstract getSchedules(): Promise<ScheduleListResponse>

  /**
   * Retry a failed job
   */
  abstract retryJob(options: { jobId: string }): Promise<{ success: boolean; message: string }>

  /**
   * Rerun a job (create a new instance with same data)
   */
  abstract rerunJob(options: {
    jobId: string
  }): Promise<{ success: boolean; message: string; newJobId?: string }>

  /**
   * Remove a job from the queue
   */
  abstract removeJob(options: { jobId: string }): Promise<{ success: boolean; message: string }>

  /**
   * Clean a queue by removing jobs with specific statuses
   */
  abstract cleanQueue(options: {
    queueName: string
    statuses?: JobStatus[]
  }): Promise<{ success: boolean; message: string }>

  /**
   * Get a specific job by its ID
   */
  abstract getJobById(options: { jobId: string }): Promise<JobRun | null>

  /**
   * Get all jobs in a flow tree by job ID
   */
  abstract getFlowJobsFromJobId(jobId: string): Promise<JobRun[] | null>
}

export type { GetJobRunsValidator }
