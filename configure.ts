import type Configure from '@adonisjs/core/commands/configure'

import { stubsRoot } from './stubs/main.js'

/**
 * List of supported transports
 */

export async function configure(command: Configure) {
  const codemods = await command.createCodemods()

  // Publish config file
  await codemods.makeUsingStub(stubsRoot, 'config/worker.stub', {})

  /**
   * Publish provider and command
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@nemoengineering/workers/worker_provider')
    rcFile.addCommand('@nemoengineering/workers/commands')
    rcFile.setDirectory('workers', 'app/workers')
  })
}
