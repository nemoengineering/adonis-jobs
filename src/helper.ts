import string from '@poppinss/utils/string'
import StringBuilder from '@poppinss/utils/string_builder'

export function workerName(name: string) {
  return new StringBuilder(name)
    .removeExtension()
    .removeSuffix('worker')
    .removeSuffix('provision')
    .pascalCase()
    .suffix(string.pascalCase('worker'))
    .toString()
}
