import StringBuilder from '@poppinss/utils/string_builder'

export function jobName(name: string) {
  return new StringBuilder(name).removeExtension().pascalCase().toString()
}
