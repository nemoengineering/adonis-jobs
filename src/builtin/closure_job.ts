import { BaseJob, BaseJobConstructor } from '../base_job.js'
import { deserializeClosure, SerializedClosure, serializeClosure } from '../helper.js'
import { JobDispatcher } from '../job_dispatcher.js'
import { ClosureConstructor } from '../../closure/closure.js'
import app from '@adonisjs/core/services/app'
import encryption from '@adonisjs/core/services/encryption'
import { RuntimeException } from '@poppinss/utils'

export type ClosureJobData = {
  closure: SerializedClosure
  signedClosure: string
}

export default class ClosureJob extends BaseJob<ClosureJobData, void> {
  async process(): Promise<void> {
    const serializedClosure = encryption.verifier.unsign<SerializedClosure>(this.data.signedClosure)
    if (!serializedClosure) {
      throw new RuntimeException('Could not verify closure signature!')
    }

    const closure = await deserializeClosure(serializedClosure)
    closure.$init(app, this.logger, this.job)

    try {
      await closure.prepare()
      await closure.$exec()
    } catch (e) {
      await closure.catch(e)
    }
  }

  static dispatch<J extends ClosureJob, C extends ClosureConstructor>(
    this: BaseJobConstructor<J>,
    closure: C,
    ...args: Parameters<InstanceType<C>['run']>
  ) {
    const serializedClosure = serializeClosure(closure, ...args)
    const signedClosure = encryption.verifier.sign(serializedClosure, undefined)

    return new JobDispatcher(this, {
      closure: serializedClosure,
      signedClosure,
    })
  }
}
