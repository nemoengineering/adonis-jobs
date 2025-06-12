import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@poppinss/utils'
import type { ApplicationService } from '@adonisjs/core/types'

import { BullMqFactory } from '../src/bull_factory.js'
import { QueueManager } from '../src/queue_manager.js'
import { ConnectionResolver } from '../src/connection_resolver.js'
import type { Config, JobEvents, Queues, QueueService } from '../src/types/index.js'

/**
 * Extended types
 */
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'queue.manager': QueueService
  }

  export interface EventsList extends JobEvents {}
}

export default class JobProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('queue.manager', async () => {
      const queueConfigProvider = this.app.config.get('queue')

      await BullMqFactory.init()
      const config = await configProvider.resolve<Config<Queues>>(this.app, queueConfigProvider)

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/queue.ts" file. Make sure you are using the "defineConfig" method',
        )
      }

      const redis = await this.app.container.make('redis')
      const connectionResolver = new ConnectionResolver(config, redis)
      return new QueueManager(config, connectionResolver)
    })
  }

  async shutdown() {
    const manager = await this.app.container.make('queue.manager')
    await manager.shutdown()
  }
}
