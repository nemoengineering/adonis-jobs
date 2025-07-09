import queueManager from '@nemoventures/adonis-jobs/services/main'

import type { JobRun, JobRunsResponse } from '../types.js'
import { BullmqPresenter, remapJobStatus } from './mappers.js'
import type { GetJobRunsValidator } from '#validators/dashboard_validator'

/**
 * Service dedicated to handling job runs retrieval, filtering, and pagination
 */
export class BullmqJobRunsService {
  /**
   * Gets list of queue names from configuration
   */
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
      const aValue = a[sortBy]
      const bValue = b[sortBy]

      if (!aValue && !bValue) return 0
      if (!aValue) return sortOrder === 'asc' ? 1 : -1
      if (!bValue) return sortOrder === 'asc' ? -1 : 1

      const aDate = new Date(aValue).getTime()
      const bDate = new Date(bValue).getTime()

      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate
    })
  }

  /**
   * Applies complex filters that require post-processing
   */
  #applyComplexFilters(jobs: JobRun[], options: GetJobRunsValidator): JobRun[] {
    let filteredJobs = jobs

    // Filter for root jobs only if requested
    if (options.onlyRootJobs) {
      filteredJobs = filteredJobs.filter((job) => job.isRootJob)
    }

    // Add more complex filters here as needed
    // e.g., date range filters, custom job name patterns, etc.

    return filteredJobs
  }

  /**
   * Retrieves jobs from all specified queues
   */
  async #fetchJobsFromQueues(options: {
    queueNames: string[]
    statuses?: string[]
    startIndex: number
    fetchLimit: number
  }): Promise<JobRun[]> {
    const { queueNames, statuses, startIndex, fetchLimit } = options
    const allRuns: JobRun[] = []

    for (const qName of queueNames) {
      const queue = queueManager.useQueue(qName as any)

      const jobs = await queue.getJobs(statuses, startIndex, fetchLimit)

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

    // Pour vérifier s'il y a une page suivante, on récupère limit + 1 jobs
    const fetchLimit = limit + 1
    const startIndex = (page - 1) * limit

    // Fetch jobs from all queues
    const allRuns = await this.#fetchJobsFromQueues({
      queueNames,
      statuses,
      startIndex,
      fetchLimit,
    })

    // Apply complex filters (like onlyRootJobs)
    const filteredJobs = this.#applyComplexFilters(allRuns, options)

    // Sort the results
    const sortedRuns = this.#sortJobRuns(filteredJobs, sortBy, sortOrder)

    // Détermine s'il y a une page suivante en vérifiant si on a plus d'items que demandé
    const hasNextPage = sortedRuns.length > limit

    // Ne retourne que le nombre demandé d'items
    const items = sortedRuns.slice(0, limit)

    return {
      items,
      currentPage: page,
      hasNextPage,
      hasPreviousPage: page > 1,
    }
  }
}
