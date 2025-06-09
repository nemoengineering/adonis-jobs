import { configProvider } from '@adonisjs/core'

import type { Config, QueueConfig } from './types/index.js'

export function defineConfig<KnownQueues extends Record<string, QueueConfig>>(
  config: Config<KnownQueues>,
) {
  return configProvider.create(async () => {
    return config
  })
}
