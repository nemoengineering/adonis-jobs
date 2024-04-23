import string from '@poppinss/utils/string'
import StringBuilder from '@poppinss/utils/string_builder'

export function jobName(name: string) {
  return new StringBuilder(name)
    .removeExtension()
    .removeSuffix('job')
    .pascalCase()
    .suffix(string.pascalCase('job'))
    .toString()
}
