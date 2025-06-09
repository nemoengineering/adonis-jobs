import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@poppinss/utils'
import type { ApplicationService } from '@adonisjs/core/types'

import { QueueManager } from '../src/queue_manager.js'
import type { Config, JobEvents, Queues, QueueService } from '../src/types.js'

/**
 * Extended types
 */
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'job.queueManager': QueueService
  }

  export interface EventsList extends JobEvents {}
}

export default class JobProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('job.queueManager', async () => {
      const queueConfigProvider = this.app.config.get('queue')

      const config = await configProvider.resolve<Config<Queues>>(this.app, queueConfigProvider)

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/queue.ts" file. Make sure you are using the "defineConfig" method',
        )
      }

      return new QueueManager(config)
    })
  }

  async shutdown() {
    const manager = await this.app.container.make('job.queueManager')
    await manager.shutdown()
  }
}
