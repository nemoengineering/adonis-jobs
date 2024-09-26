import type { ApplicationService } from '@adonisjs/core/types'
import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@poppinss/utils'
import { JobEvents, Jobs } from '../src/types.js'
import { QueueManager } from '../src/queue_manager.js'
import { Job } from '../src/job.js'

/**
 * Extended types
 */
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'job.queueManager': QueueManager
  }
  export interface EventsList extends JobEvents<Jobs extends Record<string, Job> ? Jobs : {}> {}
}

export default class JobProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('job.queueManager', async (resolver) => {
      const emitter = await resolver.make('emitter')
      const queueConfigProvider = await this.app.config.get('queue')
      const config = await configProvider.resolve<any>(this.app, queueConfigProvider)

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/queue.ts" file. Make sure you are using the "defineConfig" method'
        )
      }

      return new QueueManager(this.app, emitter, config)
    })
  }

  async shutdown() {
    const manager = await this.app.container.make('job.queueManager')
    await manager.shutdown()
  }
}
