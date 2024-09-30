import { Queues } from './types.js'
import { FlowChildJob, FlowJob, Job as BullJob } from 'bullmq'
import { JobConfig } from './job_config.js'
import { JobConstructor } from './job.js'
import queueManager from '../services/main.js'
import emitter from '@adonisjs/core/services/emitter'

type JobData<J extends JobConstructor> = InstanceType<J>['job']['data']
type JobReturn<J extends JobConstructor> = InstanceType<J>['job']['returnvalue']

export class JobDispatcher<
    TJobClass extends JobConstructor = JobConstructor,
    TJobData extends JobData<TJobClass> = JobData<TJobClass>,
    TJobReturn extends JobReturn<TJobClass> = JobReturn<TJobClass>,
  >
  extends JobConfig
  implements Promise<BullJob<TJobData, TJobReturn>>
{
  readonly #jobClass: TJobClass
  readonly #data: TJobData
  #queueName?: keyof Queues

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

  /**
   * Dispatch queue and wait until job finished. Returns the jobs output.
   */
  async waitResult(): Promise<TJobReturn> {
    const job = await this.#dispatch()
    const queueEvents = queueManager.useQueueEvents(job.queueName as keyof Queues)

    return await job.waitUntilFinished(queueEvents)
  }

  async #dispatch() {
    const manager = queueManager.useQueue<TJobData, TJobReturn>(this.#queueName)

    const data = this.#getJobData()
    const job = await manager.add(this.#jobClass.jobName, data, this.jobOptions)

    void emitter.emit('job:dispatched', { job })

    return job
  }

  // @internal
  $toFlowJob(children?: FlowChildJob[]): FlowJob {
    return {
      name: this.#jobClass.jobName,
      queueName: (this.#queueName || queueManager.config.defaultQueue) as string,
      data: this.#getJobData(),
      opts: this.jobOptions,
      children,
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
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): Promise<TResult1 | TResult2> {
    return this.#dispatch().then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined
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
