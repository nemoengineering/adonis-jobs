import { assert } from '@japa/assert'
import { snapshot } from '@japa/snapshot'
import { fileSystem } from '@japa/file-system'
import { expectTypeOf } from '@japa/expect-type'
import { configure, processCLIArgs, run } from '@japa/runner'
import { expect } from '@japa/expect'

processCLIArgs(process.argv.splice(2))
configure({
  suites: [
    /*{
      name: 'unit',
      files: ['tests/unit/!**!/!*.spec.ts'],
    },*/
    /* {
      name: 'unit',
      files: ['tests/unit/!**!/closure.spec.ts'],
    },*/
  ],
  plugins: [assert(), fileSystem(), expectTypeOf(), snapshot(), expect()],
})

run()
