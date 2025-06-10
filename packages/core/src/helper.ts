import { createRequire } from 'node:module'
import StringBuilder from '@poppinss/utils/string_builder'

export function jobName(name: string) {
  return new StringBuilder(name).removeExtension().pascalCase().toString()
}

export function isModuleInstalled(moduleName: string) {
  const require = createRequire(import.meta.url)
  try {
    require.resolve(moduleName)
    return true
  } catch {
    return false
  }
}
