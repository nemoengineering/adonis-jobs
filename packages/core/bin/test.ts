import { join } from 'node:path'
import { assert } from '@japa/assert'
import { expect } from '@japa/expect'
import { snapshot } from '@japa/snapshot'
import { fileSystem } from '@japa/file-system'
import { expectTypeOf } from '@japa/expect-type'
import { configure, processCLIArgs, run } from '@japa/runner'

processCLIArgs(process.argv.splice(2))
configure({
  files: ['**/*.spec.ts'],
  plugins: [
    assert(),
    fileSystem({ basePath: join(import.meta.dirname, '../tmp') }),
    expectTypeOf(),
    snapshot(),
    expect(),
  ],
})

run()
