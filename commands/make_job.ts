import { args, BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { stubsRoot } from '../stubs/main.js'
import { jobName } from '../src/helper.js'
import StringBuilder from '@poppinss/utils/string_builder'

export default class MakeJob extends BaseCommand {
  static commandName = 'make:job'
  static description = 'Make a new job class'
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * The name of the job file.
   */
  @args.string({ description: 'Name of the job' })
  declare name: string

  /**
   * Execute command
   */
  async run(): Promise<void> {
    const codemods = await this.createCodemods()
    const job = this.app.generators.createEntity(this.name)

    await codemods.makeUsingStub(stubsRoot, 'make/job/main.stub', {
      flags: this.parsed.flags,
      jobName: jobName(job.name),
      jobFilePath: job.path,
      jobFileName: new StringBuilder(jobName(job.name)).snakeCase().ext('.ts').toString(),
    })
  }
}
