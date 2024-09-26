import type { ApplicationService } from '@adonisjs/core/types'
import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@poppinss/utils'
import { QueueManager } from '../src/queue_manager.js'

/**
 * Extended types
 */
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'job.queueManager': QueueManager
  }

  //export interface EventsList extends JobEvents<Jobs extends Record<string, Job> ? Jobs : {}> {}
}

export default class JobProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('job.queueManager', async (_resolver) => {
      //const emitter = await resolver.make('emitter')
      const queueConfigProvider = await this.app.config.get('queue')
      const config = await configProvider.resolve<any>(this.app, queueConfigProvider)

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/queue.ts" file. Make sure you are using the "defineConfig" method'
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
