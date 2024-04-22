import { ConfigProvider } from '@adonisjs/core/types'
import { configProvider } from '@adonisjs/core'
import { Config, WorkerManagerWorkerFactory } from './types.js'

export type ResolvedConfig<KnownWorkers extends Record<string, WorkerManagerWorkerFactory>> =
  Config & {
    workers: {
      [K in keyof KnownWorkers]: KnownWorkers[K] extends ConfigProvider<infer A>
        ? A
        : KnownWorkers[K]
    }
  }

export function defineConfig<KnownWorkers extends Record<string, WorkerManagerWorkerFactory>>(
  config: Config & {
    workers: { [K in keyof KnownWorkers]: ConfigProvider<KnownWorkers[K]> | KnownWorkers[K] }
  }
): ConfigProvider<ResolvedConfig<KnownWorkers>> {
  return configProvider.create(async (app) => {
    const { workers, ...rest } = config
    const workerNames = Object.keys(workers)
    const workerz = {} as Record<string, WorkerManagerWorkerFactory>

    for (let workerName of workerNames) {
      const worker = workers[workerName]
      if (typeof worker === 'function') {
        workerz[workerName] = worker
      } else {
        workerz[workerName] = await worker.resolver(app)
      }
    }

    return { workers: workerz, ...rest } as ResolvedConfig<KnownWorkers>
  })
}
