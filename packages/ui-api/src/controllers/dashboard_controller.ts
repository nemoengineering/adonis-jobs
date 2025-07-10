import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import { QueueService } from '#services/queue_service/main'
import {
  getJobRunsValidator,
  toggleQueuePauseValidator,
  dispatchJobValidator,
} from '#validators/dashboard_validator'

@inject()
export default class DashboardController {
  constructor(private queueService: QueueService) {}

  /**
   * Returns dashboard global statistics
   */
  async overview({}: HttpContext) {
    return await this.queueService.getOverview()
  }

  /**
   * Returns global statistics only
   */
  async globalStats({}: HttpContext) {
    return await this.queueService.getGlobalStats()
  }

  /**
   * Returns paginated list of job executions
   */
  async runs({ request }: HttpContext) {
    const payload = await request.validateUsing(getJobRunsValidator)

    return await this.queueService.getJobRuns(payload)
  }

  /**
   * Returns a specific job by its ID
   */
  async jobById({ params, response }: HttpContext) {
    const job = await this.queueService.getJobById({ jobId: params.jobId })
    if (!job) return response.notFound()

    return job
  }

  /**
   * Returns list of available jobs
   */
  async availableJobs({}: HttpContext) {
    return await this.queueService.getAvailableJobs()
  }

  /**
   * Returns list of queues with their statistics
   */
  async queues({}: HttpContext) {
    return await this.queueService.getQueues()
  }

  /**
   * Returns list of job schedules
   */
  async schedules({}: HttpContext) {
    return await this.queueService.getSchedules()
  }

  /**
   * Toggles pause/resume state of a queue
   */
  async toggleQueuePause({ request }: HttpContext) {
    const payload = await request.validateUsing(toggleQueuePauseValidator)

    return await this.queueService.toggleQueuePause(payload)
  }

  /**
   * Dispatches a job with custom data
   */
  async dispatchJob({ request }: HttpContext) {
    const payload = await request.validateUsing(dispatchJobValidator)

    return await this.queueService.dispatchJob(payload)
  }

  /**
   * Returns the complete flow tree for a job by job ID
   */
  async flowJobsTree({ params, response }: HttpContext) {
    const jobs = await this.queueService.getFlowJobsFromJobId(params.jobId)
    if (!jobs) return response.notFound()

    return jobs
  }
}
