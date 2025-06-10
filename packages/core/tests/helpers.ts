import { configDotenv } from 'dotenv'
import { getActiveTest } from '@japa/runner'
import { IgnitorFactory } from '@adonisjs/core/factories'

configDotenv()

export function getActiveTestOrFail() {
  const test = getActiveTest()
  if (!test) throw new Error('No active test found')

  return test
}

export async function createFakeJob(options: {
  path: string
  name: string
  nameOverride?: string
}) {
  const test = getActiveTestOrFail()

  await test.context.fs.create(
    options.path,
    `
      import { Job } from '#job/job'

      export default class ${options.name} extends Job<{}, {}> {
        ${options.nameOverride ? `static nameOverride = '${options.nameOverride}'` : ''}

        async process() {
          return {}
        }
      }`,
  )
}

export async function setupApp() {
  const test = getActiveTestOrFail()

  const ignitor = new IgnitorFactory()
    .merge({ rcFileContents: { directories: {} } })
    .withCoreConfig()
    .withCoreProviders()
    .create(test.context.fs.baseUrl)

  const app = ignitor.createApp('web')
  await app.init()

  return { app }
}
