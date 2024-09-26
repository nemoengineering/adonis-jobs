import { JobConstructor, Queues } from './types.js'
import { Job as BullJob, JobsOptions } from 'bullmq'
import { JobConfig } from './job_config.js'
import app from '@adonisjs/core/services/app'

type JobData<J extends JobConstructor> = InstanceType<J>['job']['data']
type JobReturn<J extends JobConstructor> = InstanceType<J>['job']['returnvalue']

export type DispatchConfig = {
  queueName?: keyof Queues
  jobOptions?: JobsOptions
}

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
  readonly #config: DispatchConfig

  constructor(jobClass: TJobClass, data: TJobData) {
    super()
    this.#jobClass = jobClass
    this.#data = data
    this.#config = { queueName: jobClass.defaultQueue }
  }

  onQueue(queueName: keyof Queues): this {
    this.#config.queueName = queueName

    return this
  }

  getConfig() {
    return this.#config
  }

  getData() {
    return this.#data
  }

  getName() {
    return this.#jobClass.name
  }

  async #dispatch() {
    const manager = await app.container.make('job.queueManager')
    const queue = manager.useQueue<TJobData, TJobReturn>(this.#config.queueName)

    const job = await queue.add(this.getName(), this.#data, this.#config.jobOptions)
    //void this.#emitter.emit('job:dispatched', { jobName: queue.name, job })
    return job
  }

  async wait() {
    const job = await this.#dispatch()
    const manager = await app.container.make('job.queueManager')
    const queueEvents = manager.useQueueEvents(job.queueName as keyof Queues)

    return job.waitUntilFinished(queueEvents)
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
