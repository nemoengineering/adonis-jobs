import { args, BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { stubsRoot } from '../stubs/main.js'
import StringBuilder from '@poppinss/utils/string_builder'
import { JobFileTransformer } from '../src/job_file_transformer.js'
import { jobName } from '../src/helper.js'

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
    const project = await codemods.getTsMorphProject()
    const jobFileTransformer = new JobFileTransformer(project!)

    const job = this.app.generators.createEntity(this.name)

    const stubResult = await codemods.makeUsingStub(stubsRoot, 'make/job/main.stub', {
      flags: this.parsed.flags,
      jobName: jobName(job.name),
      jobFileName: new StringBuilder(jobName(job.name)).snakeCase().ext('.ts').toString(),
    })

    if (stubResult.status !== 'created') return

    jobFileTransformer.addJob(job)
    await jobFileTransformer.save()
  }
}
