import app from '@adonisjs/core/services/app'

import type { QueueService } from '../src/types/index.ts'

let queue: QueueService

await app?.booted(async () => {
  queue = await app.container.make('queue.manager')
})

export { queue as default }
