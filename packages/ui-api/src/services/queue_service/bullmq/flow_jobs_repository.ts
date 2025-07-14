import type { BullJob } from '@nemoventures/adonis-jobs/types'
import queueManager from '@nemoventures/adonis-jobs/services/main'

import type { JobRun } from '../types.js'
import { BullmqPresenter } from './mappers.js'

export class FlowJobsRepository {
  /**
   * Gets list of queue names from configuration
   */
  #getQueueNames(): string[] {
    return Object.keys(queueManager.config.queues)
  }

  /**
   * Find which queue a job belongs to
   */
  async #findJobQueue(jobId: string): Promise<string | null> {
    const queueNames = this.#getQueueNames()

    for (const queueName of queueNames) {
      const queue = queueManager.useQueue(queueName as any)
      const job = await queue.getJob(jobId).catch(() => null)
      if (job) return queueName
    }

    return null
  }

  /**
   * Find the root job of a flow by traversing up the parent chain
   */
  async #findRootJob(jobId: string): Promise<{ job: BullJob; queueName: string } | null> {
    const queueNames = this.#getQueueNames()

    let currentJob: BullJob | null = null
    let currentQueueName: string | null = null

    for (const queueName of queueNames) {
      const queue = queueManager.useQueue(queueName as any)
      const job = await queue.getJob(jobId).catch(() => null)
      if (job) {
        currentJob = job
        currentQueueName = queueName
        break
      }
    }

    if (!currentJob || !currentQueueName) {
      return null
    }

    // Traverse up the parent chain to find the root
    while (currentJob?.parent?.id) {
      let parentFound = false

      for (const queueName of queueNames) {
        const queue = queueManager.useQueue(queueName as any)
        const parentJob: BullJob | null = await queue.getJob(currentJob.parent.id).catch(() => null)

        if (parentJob) {
          currentJob = parentJob
          currentQueueName = queueName
          parentFound = true
          break
        }
      }

      // If we can't find the parent, current job is the root we can access
      if (!parentFound) break
    }

    if (!currentJob || !currentQueueName) return null

    return { job: currentJob, queueName: currentQueueName }
  }

  /**
   * Get all jobs in a flow tree starting from any job in the flow
   */
  async getFlowJobsFromJobId(jobId: string): Promise<JobRun[]> {
    const rootResult = await this.#findRootJob(jobId)
    if (!rootResult) return []

    const { job: rootJob, queueName: rootQueueName } = rootResult

    const flowProducer = queueManager.useFlowProducer()
    const flowTree = await flowProducer.getFlow({
      id: rootJob.id!.toString(),
      queueName: rootQueueName,
      depth: 100,
      maxChildren: 1000,
    })

    const flowJobs: JobRun[] = []

    // Recursively collect all jobs from the flow tree
    const collectJobsFromTree = async (treeNode: any, queueName: string) => {
      if (treeNode.job) {
        const jobRun = await BullmqPresenter.remapJob({ job: treeNode.job, queueName })
        if (jobRun) flowJobs.push(jobRun)
      }

      if (!treeNode.children) return

      for (const child of treeNode.children) {
        let childQueueName = queueName

        if (child.job?.id) {
          const foundQueue = await this.#findJobQueue(child.job.id.toString())
          if (foundQueue) childQueueName = foundQueue
        }

        await collectJobsFromTree(child, childQueueName)
      }
    }

    await collectJobsFromTree(flowTree, rootQueueName)

    return flowJobs
  }
}
