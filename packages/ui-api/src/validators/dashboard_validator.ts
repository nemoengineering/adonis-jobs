import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

import { JobStatus } from '../types.js'

export const getJobRunsValidator = vine.compile(
  vine.object({
    page: vine.number().optional(),
    limit: vine.number().optional(),
    status: vine.array(vine.enum(JobStatus)).optional().nullable(),
    queueName: vine.string().optional(),
    sortBy: vine.enum(['createdAt', 'completedAt']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
    createdAfter: vine.string().optional(),
    jobName: vine.string().optional(),
    onlyRootJobs: vine.boolean().optional(),
  }),
)

export type GetJobRunsValidator = Infer<typeof getJobRunsValidator>

/**
 * Validates the toggle queue pause request
 */
export const toggleQueuePauseValidator = vine.compile(
  vine.object({
    queueName: vine.string().trim().minLength(1),
    pause: vine.boolean(),
  }),
)

/**
 * Validates the dispatch job request
 */
export const dispatchJobValidator = vine.compile(
  vine.object({
    jobName: vine.string().trim().minLength(1),
    queueName: vine.string().trim().minLength(1),
    data: vine.any().optional(),
  }),
)

/**
 * Validates job action requests (retry, rerun, remove)
 */
export const jobActionValidator = vine.compile(
  vine.object({
    jobId: vine.string().trim().minLength(1),
  }),
)

/**
 * Validates the clean queue request
 */
export const cleanQueueValidator = vine.compile(
  vine.object({
    queueName: vine.string().trim(),
    statuses: vine.array(vine.enum(JobStatus)).optional(),
  }),
)

export type CleanQueueValidator = Infer<typeof cleanQueueValidator>
