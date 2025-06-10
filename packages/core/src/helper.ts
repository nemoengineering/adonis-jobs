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

/**
 * Stolen from Radashi codebase
 */
export function group<T, Key extends string | number | symbol>(
  array: readonly T[],
  getGroupId: (item: T) => Key,
): { [K in Key]?: T[] } {
  return array.reduce(
    (acc, item) => {
      const groupId = getGroupId(item)
      if (!acc[groupId]) acc[groupId] = []

      acc[groupId].push(item)
      return acc
    },
    {} as Record<Key, T[]>,
  )
}
