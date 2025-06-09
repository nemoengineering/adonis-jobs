import app from '@adonisjs/core/services/app'

import type { QueueService } from '../src/types.js'

let queueManager: QueueService

await app.booted(async () => {
  queueManager = await app.container.make('job.queueManager')
})

export { queueManager as default }
