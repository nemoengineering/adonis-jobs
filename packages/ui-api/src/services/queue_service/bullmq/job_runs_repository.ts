import queueManager from '@nemoventures/adonis-jobs/services/main'

import type { JobRun, JobRunsResponse } from '../types.js'
import { BullmqPresenter, remapJobStatus } from './mappers.js'
import type { GetJobRunsValidator } from '#validators/dashboard_validator'

export class JobRunsRepository {
  #getQueueNames(): string[] {
    return Object.keys(queueManager.config.queues)
  }

  /**
   * Sorts job runs according to the specified criteria
   */
  #sortJobRuns(
    runs: JobRun[],
    sortBy: GetJobRunsValidator['sortBy'],
    sortOrder: 'asc' | 'desc',
  ): JobRun[] {
    return runs.toSorted((a, b) => {
      const aValue = sortBy ? a[sortBy] : null
      const bValue = sortBy ? b[sortBy] : null

      if (!aValue && !bValue) return 0
      if (!aValue) return sortOrder === 'asc' ? 1 : -1
      if (!bValue) return sortOrder === 'asc' ? -1 : 1

      const aDate = new Date(aValue).getTime()
      const bDate = new Date(bValue).getTime()

      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate
    })
  }

  /**
   * Applies filtering options
   */
  #applyFiltering(jobs: JobRun[], options: GetJobRunsValidator): JobRun[] {
    let filteredJobs = jobs

    if (options.onlyRootJobs) {
      filteredJobs = filteredJobs.filter((job) => job.isRootJob)
    }

    return filteredJobs
  }

  /**
   * Retrieves jobs from all specified queues
   */
  async #fetchJobsFromQueues(options: {
    queueNames: string[]
    statuses?: string[]
    startIndex: number
    limit: number
  }): Promise<JobRun[]> {
    const { queueNames, statuses, startIndex, limit } = options
    const allRuns: JobRun[] = []

    for (const qName of queueNames) {
      const queue = queueManager.useQueue(qName as any)
      const jobs = await queue.getJobs(statuses as any, startIndex, limit)

      const remappedJobs = await Promise.all(
        jobs.map((job) => BullmqPresenter.remapJob({ job, queueName: qName })),
      )

      allRuns.push(...remappedJobs)
    }

    return allRuns
  }

  /**
   * Retrieves paginated list of job executions with filtering and sorting
   */
  async getJobRuns(options: GetJobRunsValidator): Promise<JobRunsResponse> {
    const { page = 1, limit = 10, queueName, sortBy = 'createdAt', sortOrder = 'desc' } = options

    const queueNames = queueName ? [queueName] : this.#getQueueNames()
    const statuses = options.status?.map((status) => remapJobStatus(status)) || undefined
    const startIndex = (page - 1) * limit

    const allRuns = await this.#fetchJobsFromQueues({
      queueNames,
      statuses,
      startIndex,
      limit: limit + 1, // Fetch one extra to determine if there's a next page
    })

    const filteredJobs = this.#applyFiltering(allRuns, options)

    const sortedRuns = this.#sortJobRuns(filteredJobs, sortBy, sortOrder)
    const hasNextPage = sortedRuns.length > limit
    const items = sortedRuns.slice(0, limit)

    return { items, currentPage: page, hasNextPage, hasPreviousPage: page > 1 }
  }
}
