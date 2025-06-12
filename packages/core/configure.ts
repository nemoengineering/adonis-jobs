import type ConfigureCommand from '@adonisjs/core/commands/configure'

import { stubsRoot } from './stubs/main.js'

export async function configure(command: ConfigureCommand) {
  const codemods = await command.createCodemods()
  await codemods.makeUsingStub(stubsRoot, 'config/queue.stub', {})

  /**
   * Publish provider and command
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@nemoventures/adonis-jobs/queue_provider')
    rcFile.addCommand('@nemoventures/adonis-jobs/commands')
  })
}
