import { QueueConfig } from './types.js'

export class Dispatcher<KnownQueues extends Record<string, QueueConfig>, Return>
  implements Promise<Return>
{
  queueName: keyof KnownQueues | undefined

  private callback: (dispatcher: this) => Promise<Return>

  constructor(callback: (dispatcher: Dispatcher<KnownQueues, Return>) => Promise<Return>) {
    this.callback = callback
  }

  onQueue(queueName: keyof KnownQueues): this {
    this.queueName = queueName

    return this
  }

  then<TResult1 = Return, TResult2 = never>(
    onfulfilled?: ((value: Return) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): Promise<TResult1 | TResult2> {
    return this.callback(this).then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined
  ): Promise<Return | TResult> {
    return this.callback(this).catch(onrejected)
  }

  finally(onfinally?: (() => void) | null | undefined): Promise<Return> {
    return this.callback(this).finally(onfinally)
  }

  get [Symbol.toStringTag]() {
    return this.constructor.name
  }
}
