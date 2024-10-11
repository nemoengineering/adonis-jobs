import { test } from '@japa/runner'
import { deserializeClosure, serializeClosure } from '../../src/helper.js'
import { Closure } from '../../closure/closure.js'
import { AppFactory } from '@adonisjs/core/factories/app'
import { ApplicationService } from '@adonisjs/core/types'
import { Job, QueueBase } from 'bullmq'
import { Logger } from '@adonisjs/core/logger'

const BASE_URL = new URL('./', import.meta.url)
const app = new AppFactory().create(BASE_URL, () => {}) as ApplicationService
await app.init()

test.group('Closure', () => {
  test('i can serialize a closure and execute it', async () => {
    const serialized = serializeClosure(
      class extends Closure {
        async run(arg1: string, arg2: number) {
          const { JobConfig } =
            await this.import<typeof import('../../src/job_config.js')>('../../src/job_config.js')

          console.log({ JobConfig })
          console.log('closure', arg1, arg2, this.app)
        }
      },
      'value1',
      2
    )

    const closure = await deserializeClosure(serialized)

    closure.$init(app, new Logger({}), new Job(new QueueBase('test'), '', undefined))
    closure.prepare()
    await closure.$exec()
  })
})
