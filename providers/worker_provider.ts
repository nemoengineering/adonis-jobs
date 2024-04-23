import type { ApplicationService } from '@adonisjs/core/types'
import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@poppinss/utils'
import { WorkerEvents, Workers, QueueService } from '../src/types.js'
import { QueueManager } from '../src/queue_manager.js'
import { Worker } from '../src/worker.js'

/**
 * Extended types
 */
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'queue.manager': QueueService
  }
  export interface EventsList
    extends WorkerEvents<Workers extends Record<string, Worker> ? Workers : {}> {}
}

export default class WorkerProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('queue.manager', async (resolver) => {
      const emitter = await resolver.make('emitter')
      const workerConfigProvider = await this.app.config.get('worker')
      const config = await configProvider.resolve<any>(this.app, workerConfigProvider)

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/worker.ts" file. Make sure you are using the "defineConfig" method'
        )
      }

      return new QueueManager(this.app, emitter, config) as QueueService
    })
  }

  async shutdown() {
    const workers = await this.app.container.make('queue.manager')
    await workers.shutdown()
  }
}
