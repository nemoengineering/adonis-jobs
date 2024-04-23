import app from '@adonisjs/core/services/app'
import { QueueService } from '../src/types.js'

let queue: QueueService

await app.booted(async () => {
  queue = await app.container.make('queue.manager')
})

export { queue as default }
