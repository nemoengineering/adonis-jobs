import type { Job as BullJob } from 'bullmq'
import type { Logger } from '@adonisjs/core/logger'
import type { ApplicationService } from '@adonisjs/core/types'

import type { SerializableValue } from '../src/helper.js'

export type ClosureConstructor = {
  new (): Closure
}

export abstract class Closure<A extends SerializableValue[] = any> {
  declare app: ApplicationService
  declare logger: Logger
  declare job: BullJob<never, never>

  #appUrl!: string
  #args!: A
  #initialized = false
  #argsSet = false

  // @internal
  $setArgs(args: A) {
    this.#args = args
    this.#argsSet = true
  }

  // @internal
  $init(app: ApplicationService, logger: Logger, job: BullJob) {
    this.app = app
    this.logger = logger
    this.job = job as BullJob<never, never>

    this.#appUrl = app.makeURL().href
    this.#initialized = true
  }

  // @internal
  async $exec() {
    if (!this.#argsSet) {
      throw new Error('Closure args not set')
    }
    if (!this.#initialized) {
      throw new Error('Closure not initialized')
    }

    await this.run(...this.#args)
  }

  //// Public methods

  prepare(): Promise<void> | void {}

  abstract run(...args: A): Promise<void> | void

  catch(e: Error): Promise<void> | void {
    throw e
  }

  async import<T>(modulePath: string): Promise<T> {
    const { resolve } = await import('import-meta-resolve')

    return (await import(resolve(modulePath, `${this.#appUrl}`))) as T
  }
}
