import { args, BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { stubsRoot } from '../stubs/main.js'
import StringBuilder from '@poppinss/utils/string_builder'
import { WorkerFileTransformer } from '../src/worker_file_transformer.js'
import { workerName } from '../src/helper.js'

export default class MakeWorker extends BaseCommand {
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
   * Execute command
   */
  async run(): Promise<void> {
    const codemods = await this.createCodemods()
    const project = await codemods.getTsMorphProject()
    const workerFileTransformer = new WorkerFileTransformer(project!)

    const worker = this.app.generators.createEntity(this.name)

    const stubResult = await codemods.makeUsingStub(stubsRoot, 'make/worker/main.stub', {
      flags: this.parsed.flags,
      workerName: workerName(worker.name),
      workerFileName: new StringBuilder(workerName(worker.name)).snakeCase().ext('.ts').toString(),
    })

    if (stubResult.status !== 'created') return

    workerFileTransformer.addWorker(worker)
    await workerFileTransformer.save()
  }
}
