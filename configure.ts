import type Configure from '@adonisjs/core/commands/configure'
import { stubsRoot } from './stubs/main.js'

/**
 * List of supported transports
 */

export async function configure(command: Configure) {
  const codemods = await command.createCodemods()

  // Publish config file
  await codemods.makeUsingStub(stubsRoot, 'config/queue.stub', {})

  /**
   * Add environment variables
   */
  await codemods.defineEnvVariables({
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: '',
  })

  /**
   * Validate environment variables
   */
  await codemods.defineEnvValidations({
    variables: {
      REDIS_HOST: `Env.schema.string({ format: 'host' })`,
      REDIS_PORT: 'Env.schema.number()',
      REDIS_PASSWORD: 'Env.schema.string.optional()',
    },
  })

  /**
   * Publish provider and command
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@nemoengineering/adonis-jobs/queue_provider')
    rcFile.addCommand('@nemoengineering/adonis-jobs/commands')
    rcFile.setDirectory('jobs', 'app/jobs')
  })
}
