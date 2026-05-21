import app from '@adonisjs/core/services/app'

import type { QueueService } from '../src/types/index.ts'

let queue: QueueService

await app?.booted(async () => {
  queue = await app.container.make('queue.manager')
})

/**
 * @internal
 *
 * Replace the cached queue service. Only intended for test setups where
 * the application bootstrap order does not allow the default `booted`
 * callback to resolve the binding. Production code must not call this.
 */
export function setQueueServiceForTesting(service: QueueService) {
  queue = service
}

export { queue as default }
