import ky from 'ky'
import type {
  AvailableJobResponse,
  DashboardOverview,
  DispatchJobRequest,
  DispatchJobResponse,
  GetJobRunsValidator,
  GlobalStats,
  JobRun,
  JobRunsResponse,
  QueueListResponse,
  ScheduleListResponse,
  JobActionRequest,
  JobActionResponse,
} from '@nemoventures/adonis-jobs-ui-api/types'

type MaybeArray<T> = T | T[]
export type QueryParameters = Record<
  string,
  MaybeArray<string | number | boolean | null | undefined>
>

/**
 * Search params serializer tailored for AdonisJS server ( stolen from Tuyau codebase )
 */
export function buildSearchParams(query: QueryParameters) {
  if (!query) return ''

  let stringified = ''
  const append = (
    key: string,
    value: string | number | boolean | null | undefined,
    isArray = false,
  ) => {
    if (value === undefined || value === null) return

    const encodedKey = encodeURIComponent(key)
    const encodedValue = encodeURIComponent(value)
    const keyValuePair = `${encodedKey}${isArray ? '[]' : ''}=${encodedValue}`

    stringified += (stringified ? '&' : '?') + keyValuePair
  }

  for (const [key, value] of Object.entries(query)) {
    if (!value) continue

    if (Array.isArray(value)) {
      for (const v of value) {
        append(key, v, true)
      }
    } else {
      append(key, `${value}`)
    }
  }

  return stringified
}

interface ApiConfig {
  baseUrl?: string
  timeout?: number
  retry?: number
}

/**
 * API client for BullMQ dashboard
 */
export class DashboardApi {
  #client: typeof ky

  constructor(config: ApiConfig = {}) {
    const defaultConfig = {
      baseUrl: 'http://localhost:3333',
      timeout: 10_000,
      ...config,
    }

    this.#client = ky.create({
      prefixUrl: defaultConfig.baseUrl,
      timeout: defaultConfig.timeout,
      retry: defaultConfig.retry,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Fetch dashboard overview data
   */
  async getOverview() {
    return this.#client.get('overview').json<DashboardOverview>()
  }

  /**
   * Fetch global statistics
   */
  async getGlobalStats() {
    return this.#client.get('global-stats').json<GlobalStats>()
  }

  /**
   * Fetch job runs
   */
  async getJobRuns(options: GetJobRunsValidator) {
    return this.#client
      .get('runs', {
        searchParams: buildSearchParams({
          page: options.page || 1,
          limit: options.limit || 50,
          queueName: options.queueName || '',
          sortBy: options.sortBy || 'createdAt',
          sortOrder: options.sortOrder || 'desc',
          status: options.status,
          onlyRootJobs: options.onlyRootJobs || false,
        }),
      })
      .json<JobRunsResponse>()
  }

  /**
   * Fetch a specific job by its ID
   */
  async getJobById(jobId: string) {
    return this.#client.get(`runs/${jobId}`).json<JobRun>()
  }

  /**
   * Fetch complete flow tree starting from any job in the flow
   */
  async getFlowJobsTree(jobId: string) {
    return this.#client.get(`flows/job/${jobId}/tree`).json<JobRun[]>()
  }

  /**
   * Fetch available jobs list
   */
  async getAvailableJobs() {
    return this.#client.get('available-jobs').json<AvailableJobResponse>()
  }

  /**
   * Dispatch a job with custom data
   */
  async dispatchJob(options: DispatchJobRequest) {
    return this.#client.post('dispatch-job', { json: options }).json<DispatchJobResponse>()
  }

  /**
   * Fetch queues list with their statistics
   */
  async getQueues() {
    return this.#client.get('queues').json<QueueListResponse>()
  }

  /**
   * Pause or resume a queue
   */
  async toggleQueuePause(options: { queueName: string; pause: boolean }) {
    return this.#client.post('toggle-queue-pause', { json: options }).json<void>()
  }

  /**
   * Fetch job schedules list
   */
  async getSchedules() {
    return this.#client.get('schedules').json<ScheduleListResponse>()
  }

  /**
   * Retry a failed job
   */
  async retryJob(options: JobActionRequest) {
    return this.#client.post('jobs/retry', { json: options }).json<JobActionResponse>()
  }

  /**
   * Rerun a job (create a new instance with same data)
   */
  async rerunJob(options: JobActionRequest) {
    return this.#client.post('jobs/rerun', { json: options }).json<JobActionResponse>()
  }

  /**
   * Remove a job from the queue
   */
  async removeJob(options: JobActionRequest) {
    return this.#client.post('jobs/remove', { json: options }).json<JobActionResponse>()
  }
}

export const dashboardApi = new DashboardApi()
