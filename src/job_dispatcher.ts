import { Queues } from './types.js'
import { FlowChildJob, FlowJob, Job as BullJob, UnrecoverableError } from 'bullmq'
import { JobConfig } from './job_config.js'
import { JobConstructor } from './job.js'

type JobData<J extends JobConstructor> = InstanceType<J>['job']['data']
type JobReturn<J extends JobConstructor> = InstanceType<J>['job']['returnvalue']

export class Dispatcher<
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

  onQueue(queueName: keyof Queues): this {
    this.#queueName = queueName

    return this
  }

  // @internal
  async $toFlowJob(defaultQueue: keyof Queues, children?: FlowChildJob[]): Promise<FlowJob> {
    return {
      name: this.#jobClass.name,
      queueName: (this.#queueName || defaultQueue) as string,
      data: await this.#getJobData(),
      opts: this.jobOptions,
      children,
    }
  }

  async #dispatch() {
    const { default: app } = await import('@adonisjs/core/services/app')
    const manager = await app.container.make('job.queueManager')
    const emitter = await app.container.make('emitter')
    const queue = manager.useQueue<TJobData, TJobReturn>(this.#queueName)

    const data = await this.#getJobData()
    const job = await queue.add(this.#jobClass.name, data, this.jobOptions)
    void emitter.emit('job:dispatched', { job })

    return job
  }

  async #getJobData(): Promise<TJobData> {
    if (this.#jobClass.encrypted) {
      return (await this.#jobClass.encrypt(this.#data)) as TJobData
    }

    return this.#data
  }

  async waitResult(): Promise<TJobReturn> {
    const { default: app } = await import('@adonisjs/core/services/app')
    const job = await this.#dispatch()
    const manager = await app.container.make('job.queueManager')
    const queueEvents = manager.useQueueEvents(job.queueName as keyof Queues)

    const returnData = await job.waitUntilFinished(queueEvents)

    if (this.#jobClass.encrypted) {
      return await this.#jobClass.decrypt(returnData as string)
    }

    return returnData
  }

  // @internal
  async $decrypt(data: string): Promise<TJobReturn> {
    const { default: encryption } = await import('@adonisjs/core/services/encryption')

    const decrypted = encryption.decrypt<TJobReturn>(data)
    if (decrypted === null) {
      throw new UnrecoverableError('Could not decrypt job payload')
    }

    return decrypted
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
