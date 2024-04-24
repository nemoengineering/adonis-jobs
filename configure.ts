import type Configure from '@adonisjs/core/commands/configure'
import { stubsRoot } from './stubs/main.js'

/**
 * List of supported transports
 */

export async function configure(command: Configure) {
  const codemods = await command.createCodemods()

  // Publish config file
  await codemods.makeUsingStub(stubsRoot, 'config/job.stub', {})

  // Publish start/jobs file
  await codemods.makeUsingStub(stubsRoot, 'start/jobs.stub', {})

  /**
   * Publish provider and command
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@nemoengineering/jobs/job_provider')
    rcFile.addCommand('@nemoengineering/jobs/commands')
    rcFile.setDirectory('jobs', 'app/jobs')
    rcFile.addPreloadFile('#start/jobs')
  })
}
