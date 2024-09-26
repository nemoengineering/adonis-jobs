import { QueueConfig, Queues } from './types.js'
import { JobsOptions } from 'bullmq'
import { JobConfig } from './job_config.js'

export type DispatchConfig<KnownQueues extends Record<string, QueueConfig>> = {
  queueName?: keyof KnownQueues
  jobOptions?: JobsOptions
}

export class JobDispatcher<Data, Return, KnownQueues extends Record<string, QueueConfig> = Queues>
  extends JobConfig
  implements Promise<Return>
{
  #data: Data
  #config: DispatchConfig<KnownQueues> = {}
  #callback: (dispatcher: DispatchConfig<KnownQueues>) => Promise<Return>

  constructor(data: Data, callback: (config: DispatchConfig<KnownQueues>) => Promise<Return>) {
    super()
    this.#callback = callback
    this.#data = data
  }

  onQueue(queueName: keyof KnownQueues): this {
    this.#config.queueName = queueName

    return this
  }

  getConfig() {
    return this.#config
  }

  getData() {
    return this.#data
  }

  then<TResult1 = Return, TResult2 = never>(
    onfulfilled?: ((value: Return) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): Promise<TResult1 | TResult2> {
    return this.#callback(this.#config).then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined
  ): Promise<Return | TResult> {
    return this.#callback(this.#config).catch(onrejected)
  }

  finally(onfinally?: (() => void) | null | undefined): Promise<Return> {
    return this.#callback(this.#config).finally(onfinally)
  }

  get [Symbol.toStringTag]() {
    return this.constructor.name
  }
}
