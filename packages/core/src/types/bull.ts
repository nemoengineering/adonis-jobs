import type { HasPro } from './index.js'

/**
 * Since we are allowing the user to define the BullMQ version they want to use,
 * (pro or oss), we need to re-export the correct types based on the version configured,
 * because some Pro variants have different types than the OSS version.
 */
export type BullJob<A = any, B = any, C extends string = string> = HasPro extends true
  ? import('@taskforcesh/bullmq-pro').JobPro<A, B, C>
  : import('bullmq').Job<A, B, C>
export type BullQueue<T = any, X = any> = HasPro extends true
  ? import('@taskforcesh/bullmq-pro').QueuePro<T, X>
  : import('bullmq').Queue<T, X>
export type BullWorker<T = any, X = any> = HasPro extends true
  ? import('@taskforcesh/bullmq-pro').WorkerPro<T, X>
  : import('bullmq').Worker<T, X>
export type BullFlowProducer = HasPro extends true
  ? import('@taskforcesh/bullmq-pro').FlowProducerPro
  : import('bullmq').FlowProducer
export type BullQueueEvents = HasPro extends true
  ? import('@taskforcesh/bullmq-pro').QueueEventsPro
  : import('bullmq').QueueEvents
export type BullJobsOptions = HasPro extends true
  ? import('@taskforcesh/bullmq-pro').JobsProOptions
  : import('bullmq').JobsOptions
export type BullFlowChildJob = HasPro extends true
  ? import('@taskforcesh/bullmq-pro').FlowChildJobPro
  : import('bullmq').FlowChildJob
export type BullFlowJob = HasPro extends true
  ? import('@taskforcesh/bullmq-pro').FlowJobPro
  : import('bullmq').FlowJob
export type BullQueueOptions = HasPro extends true
  ? import('@taskforcesh/bullmq-pro').QueueProOptions
  : import('bullmq').QueueOptions
export type BullWorkerOptions = HasPro extends true
  ? import('@taskforcesh/bullmq-pro').WorkerProOptions
  : import('bullmq').WorkerOptions
export type BullConnectionOptions = HasPro extends true
  ? import('@taskforcesh/bullmq-pro').ConnectionOptions
  : import('bullmq').ConnectionOptions
export type BullRepeatOptions = HasPro extends true
  ? import('@taskforcesh/bullmq-pro').RepeatOptions
  : import('bullmq').RepeatOptions
export type BullJobNode = HasPro extends true
  ? import('@taskforcesh/bullmq-pro').JobNodePro
  : import('bullmq').JobNode
