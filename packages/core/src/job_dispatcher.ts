import emitter from '@adonisjs/core/services/emitter'
import type { FlowChildJob, FlowJob, Job as BullJob } from 'bullmq'

import { JobFlow } from './job_flow.js'
import type { Queues } from './types.js'
import { JobConfig } from './job_config.js'
import queueManager from '../services/main.js'
import type { BaseJobConstructor } from './base_job.js'

type JobData<J extends BaseJobConstructor> = InstanceType<J>['job']['data']

type JobReturn<J extends BaseJobConstructor> = InstanceType<J>['job']['returnvalue']

export class JobDispatcher<
    TJobClass extends BaseJobConstructor = BaseJobConstructor,
    TJobData extends JobData<TJobClass> = JobData<TJobClass>,
    TJobReturn extends JobReturn<TJobClass> = JobReturn<TJobClass>,
  >
  extends JobConfig
  implements Promise<BullJob<TJobData, TJobReturn>>
{
  readonly #jobClass: TJobClass
  readonly #data: TJobData
  #queueName?: keyof Queues
  #children?: JobDispatcher[]

  constructor(jobClass: TJobClass, data: TJobData) {
    super()
    this.#jobClass = jobClass
    this.#data = data
    this.#queueName = jobClass.defaultQueue
  }

  /**
   * Send job to specified queue. Default queue in config and in job class will be ignored.
   * @param queueName
   */
  onQueue(queueName: keyof Queues): this {
    this.#queueName = queueName

    return this
  }

  addChildren(jobs: JobDispatcher[]) {
    if (jobs.length === 0) return this

    if (!this.#children) {
      this.#children = []
    }
    this.#children.push(...jobs)

    return this
  }

  /**
   * Dispatch queue and wait until job finished. Returns the jobs output.
   */
  async waitResult(): Promise<TJobReturn> {
    const job = await this.#dispatch()
    const queueEvents = queueManager.useQueueEvents(job.queueName as keyof Queues)

    return await job.waitUntilFinished(queueEvents)
  }

  async #dispatch(): Promise<BullJob<TJobData, TJobReturn>> {
    if (this.#children) {
      const flow = new JobFlow(this)
      const { job } = await flow.dispatch()
      return job
    }

    const manager = queueManager.useQueue<TJobData, TJobReturn>(this.#queueName)

    const data = this.#getJobData()
    const job = await manager.add(this.#jobClass.jobName as any, data, this.jobOptions)

    void emitter.emit('job:dispatched', { job })

    return job as BullJob<TJobData, TJobReturn>
  }

  // @internal
  $toFlowJob(children?: FlowChildJob[]): FlowJob {
    const jobChildren = this.#children?.map((j) => j.$toFlowJob())

    return {
      name: this.#jobClass.jobName,
      queueName: (this.#queueName || queueManager.config.defaultQueue) as string,
      data: this.#getJobData(),
      opts: this.jobOptions,
      children: jobChildren || children ? [...(jobChildren || []), ...(children || [])] : undefined,
    }
  }

  #getJobData(): TJobData {
    if (this.#jobClass.encrypted) {
      return this.#jobClass.encrypt(this.#data) as TJobData
    }

    return this.#data
  }

  then<TResult1 = BullJob<TJobData, TJobReturn>, TResult2 = never>(
    onfulfilled?:
      | ((value: BullJob<TJobData, TJobReturn>) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined,
  ): Promise<TResult1 | TResult2> {
    return this.#dispatch().then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined,
  ): Promise<BullJob<TJobData, TJobReturn> | TResult> {
    return this.#dispatch().catch(onrejected)
  }

  finally(onfinally?: (() => void) | null | undefined): Promise<BullJob<TJobData, TJobReturn>> {
    return this.#dispatch().finally(onfinally)
  }

  get [Symbol.toStringTag]() {
    return this.constructor.name
  }
}
