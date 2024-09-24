import { configProvider } from '@adonisjs/core'
import { Config, QueueConfig } from './types.js'

export function defineConfig<KnownQueues extends Record<string, QueueConfig>>(
  config: Config<KnownQueues>
) {
  return configProvider.create(async () => {
    return config
  })
}
