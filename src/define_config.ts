import { configProvider } from '@adonisjs/core'
import { Config } from './types.js'

export function defineConfig(config: Config) {
  return configProvider.create(async () => {
    return config
  })
}
