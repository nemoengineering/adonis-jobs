import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { stubsRoot } from '../stubs/main.js'
import StringBuilder from '@poppinss/utils/string_builder'
import string from '@poppinss/utils/string'

export default class MakeNotification extends BaseCommand {
  static commandName = 'make:worker'
  static description = 'Make a new worker class'
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * The name of the worker file.
   */
  @args.string({ description: 'Name of the worker' })
  declare name: string

  /**
   * Define the model for the worker
   */
  @flags.string({ description: 'The intent model for the worker', default: 'User' })
  declare model: string

  /**
   * Execute command
   */
  async run(): Promise<void> {
    const codemods = await this.createCodemods()

    const entity = this.app.generators.createEntity(this.name)
    const model = this.app.generators.createEntity(this.model)
    await codemods.makeUsingStub(stubsRoot, 'make/worker/main.stub', {
      flags: this.parsed.flags,
      workerName: workerName(entity.name),
      workerFileName: new StringBuilder(workerName(entity.name))
        .snakeCase()
        .ext('.ts')
        .toString(),
      model: model,
      modelName: this.app.generators.modelName(model.name),
      modelFileName: new StringBuilder(this.app.generators.modelName(model.name))
        .snakeCase()
        .toString(),
    })
  }
}

function workerName(name: string) {
  return new StringBuilder(name)
    .removeExtension()
    .removeSuffix('worker')
    .removeSuffix('provision')
    .pascalCase()
    .suffix(string.pascalCase('worker'))
    .toString()
}
