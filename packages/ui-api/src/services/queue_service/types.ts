/**
 * ----------------------------------
 * Overview API Types
 * ----------------------------------
 */
export interface GlobalStats {
  totalJobs: number
  activeJobs: number
  completedJobs: number
  failedJobs: number
  waitingJobs: number
  delayedJobs: number
  pausedJobs: number
  totalQueues: number
}

export interface PerformanceMetrics {
  jobsPerSecond: number
  jobsPerMinute: number
  jobsPerHour: number
  averageWaitTime: number
  averageProcessingTime: number
  successRate: number
  errorRate: number
}

export interface DashboardOverview {
  globalStats: GlobalStats
  performanceMetrics: PerformanceMetrics
  recentActivity: {
    recentJobs: Array<{
      id: string
      name: string
      queueName: string
      status: string
      timestamp: string
    }>
    recentErrors: Array<{
      jobId: string
      jobName: string
      queueName: string
      error: string
      timestamp: string
    }>
  }
}

/**
 * ----------------------------------
 * Dispatch Job API Types
 * ----------------------------------
 */
export interface DispatchJobRequest {
  jobName: string
  queueName: string
  data?: Record<string, any>
}

export interface DispatchJobResponse {
  jobId: string
  message: string
}

/**
 * ----------------------------------
 * Get Job Runs API Types
 * ----------------------------------
 */
export interface JobRun {
  id: string
  name: string
  queueName: string
  status: JobStatus
  data: Record<string, any>
  startedAt?: string
  completedAt?: string
  failedAt?: string
  duration?: number
  attempts: number
  maxAttempts: number
  progress?: { percentage: number }
  error?: { message: string; stack?: string }
  returnValue?: any
  createdAt: string
  processedAt?: string
  // Flow metadata
  isFlowJob?: boolean
  isRootJob?: boolean
  flowId?: string
  flowKey?: string
  parentJobId?: string
  parentKey?: string
}

export type JobRunsResponse = PaginatedResponse<JobRun>

/**
 * ----------------------------------
 * Scheduled Jobs API Types
 * ----------------------------------
 */

export type ScheduleStatus = 'active' | 'paused' | 'error'

export interface ScheduleInfo {
  id: string
  name?: string
  queueName: string
  pattern?: string
  every?: number
  status: ScheduleStatus
  nextRunAt?: string
  lastRunAt?: string
  jobTemplate?: {
    name?: string
    data?: Record<string, any>
    opts?: Record<string, any>
  }
  createdAt: string
  updatedAt: string
}

export interface ScheduleListResponse {
  schedules: ScheduleInfo[]
}

/**
 * ----------------------------------
 * Common things
 * ----------------------------------
 */
export enum JobStatus {
  Active = 'active',
  Failed = 'failed',
  Paused = 'paused',
  Waiting = 'waiting',
  Delayed = 'delayed',
  Unknown = 'unknown',
  Completed = 'completed',
}

export enum QueueStatus {
  Error = 'error',
  Active = 'active',
  Paused = 'paused',
}

export type PaginatedResponse<T> = {
  items: T[]
  currentPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type AvailableJobResponse = Array<{
  name: string
  defaultQueue?: string
}>

/**
 * ----------------------------------
 * Job Actions API Types
 * ----------------------------------
 */
export interface JobActionRequest {
  jobId: string
}

export interface JobActionResponse {
  success: boolean
  message: string
  newJobId?: string // Only for rerun action
}
