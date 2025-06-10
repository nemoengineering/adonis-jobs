import { fileURLToPath } from 'node:url'

import { type BaseJobConstructor } from '../job/base_job.js'

interface DuplicateJob {
  jobName: string
  jobs: Array<{ job: BaseJobConstructor; file: URL | string }> | undefined
}

export class DuplicateJobException extends Error {
  constructor(appRoot: URL, duplicates: DuplicateJob[]) {
    let errorMessage = 'Duplicate job names detected:'

    for (const { jobName, jobs = [] } of duplicates) {
      errorMessage += `\n\nJob name "${jobName}" is used in multiple files:\n`
      errorMessage += jobs
        .map(({ file }) => {
          const relativePath = fileURLToPath(file).replace(appRoot.pathname, '')
          return `- ${relativePath}`
        })
        .join('\n')
    }

    errorMessage +=
      '\n\nEach job must have a unique name. You can use the "nameOverride" static property to customize the job name.'

    super(errorMessage)
    this.name = 'DuplicateJobException'
  }
}
