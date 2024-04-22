import type { ApplicationService } from '@adonisjs/core/types'
import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@poppinss/utils'
import {WorkerEvents, WorkerManagerWorkerFactory, Workers, WorkerService} from "../src/types.js";
import {WorkerManager} from "../src/worker_manager.js";

/**
 * Extended types
 */
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'worker.manager': WorkerService
  }
  export interface EventsList
    extends WorkerEvents<
      Workers extends Record<string, WorkerManagerWorkerFactory>
        ? Workers
        : {}
    > {}
}

export default class WorkerProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('worker.manager', async (resolver) => {
      const emitter = await resolver.make('emitter')
      const workerConfigProvider = await this.app.config.get('worker')
      const config = await configProvider.resolve<any>(this.app, workerConfigProvider)

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/worker.ts" file. Make sure you are using the "defineConfig" method'
        )
      }

      return new WorkerManager(emitter, config) as WorkerService
    })
  }

  async shutdown() {
    const workers = await this.app.container.make("worker.manager")
    await workers.shutdown()
  }
}
