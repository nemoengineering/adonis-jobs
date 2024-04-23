import type { ApplicationService } from '@adonisjs/core/types'
import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@poppinss/utils'
import { JobEvents, Jobs, JobService } from '../src/types.js'
import { JobManager } from '../src/job_manager.js'
import { Job } from '../src/job.js'

/**
 * Extended types
 */
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'job.manager': JobService
  }
  export interface EventsList extends JobEvents<Jobs extends Record<string, Job> ? Jobs : {}> {}
}

export default class JobProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('job.manager', async (resolver) => {
      const emitter = await resolver.make('emitter')
      const workerConfigProvider = await this.app.config.get('job')
      const config = await configProvider.resolve<any>(this.app, workerConfigProvider)

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/worker.ts" file. Make sure you are using the "defineConfig" method'
        )
      }

      return new JobManager(this.app, emitter, config) as JobService
    })
  }

  async shutdown() {
    const workers = await this.app.container.make('job.manager')
    await workers.shutdown()
  }
}
