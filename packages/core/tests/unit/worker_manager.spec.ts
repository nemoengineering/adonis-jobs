import { test } from '@japa/runner'
import { IgnitorFactory } from '@adonisjs/core/factories'

import FakeJob from '../../factories/jobs/job.js'
import { JobChain } from '../../src/job_chain.js'
import { BulkDispatcher } from '../../src/bulk_dispatcher.js'
import FakeSubDirJob from '../../factories/jobs/subdir/job.js'

const BASE_URL = new URL('./../../', import.meta.url)

test.group('WorkerManager', () => {
  test('it can load tob classes', async () => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          directories: {
            jobs: 'factories/jobs',
          },
        },
      })
      .withCoreConfig()
      .withCoreProviders()
      .create(BASE_URL)

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    await new JobChain([
      FakeJob.dispatch({ input: 'refine' }).addChildren([
        FakeSubDirJob.dispatch({ input: 'account' }),
        FakeSubDirJob.dispatch({ input: 'account' }),
      ]),
      FakeSubDirJob.dispatch({ input: 'transmit' }),
      FakeJob.dispatch({ input: 'bulk' }),
    ]).dispatch()

    new BulkDispatcher([FakeJob.dispatch({ input: '3' })])

    const d = await FakeJob.dispatch({ input: '3' })
    const dd = await FakeJob.decrypt("{ input: '' }")

    console.log(d, dd)
  })
})
