import { test } from '@japa/runner'
import { IgnitorFactory } from '@adonisjs/core/factories'
import FakeJob from '../../factories/jobs/job.js'
import { Chain } from '../../src/chain.js'
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

    await new Chain([
      FakeJob.dispatch({ input: '1' }),
      FakeSubDirJob.dispatch({ input: '2' }),
      FakeJob.dispatch({ input: '3' }),
    ]).dispatch()
  })
})
