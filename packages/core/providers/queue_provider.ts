import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@poppinss/utils/exception'
import type { ApplicationService } from '@adonisjs/core/types'

import { BullMqFactory } from '../src/bull_factory.ts'
import { QueueManager } from '../src/queue_manager.ts'
import { ConnectionResolver } from '../src/connection_resolver.ts'
import type { Config, JobEvents, Queues, QueueService } from '../src/types/index.ts'

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

  static isWorkerCommand = false

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
      const logger = await this.app.container.make('logger')
      return new QueueManager(this.app.appRoot, config, connectionResolver, logger)
    })
  }

  async shutdown() {
    if (JobProvider.isWorkerCommand) return
    const manager = await this.app.container.make('queue.manager')
    await manager.shutdown()
  }
}
