import { fileURLToPath } from 'node:url'
import { fsReadAll, isScriptFile } from '@poppinss/utils'

import { group } from './helper.js'
import { rootDir } from '../root_dir.js'
import { type BaseJobConstructor } from './job/base_job.js'
import { DuplicateJobException } from './errors/duplicate_job_exception.js'

/**
 * Discover and load job classes from the application directory.
 * Ensure that all job names are unique.
 */
export class JobDiscoverer {
  #appRoot: URL

  constructor(appRoot: URL) {
    this.#appRoot = appRoot
  }

  /**
   * Import job files from the application directory
   */
  async #importAppJobs() {
    const jobFiles = await fsReadAll(this.#appRoot, {
      pathType: 'url',
      ignoreMissingRoot: true,
      filter: (file) => {
        const isScript = isScriptFile(file)
        if (!isScript) return false

        const isNodeModule = fileURLToPath(file).includes('/node_modules/')
        if (isNodeModule) return false

        const fileName = file.toString().split('/').pop() || ''
        return fileName.endsWith('_job.ts') || fileName.endsWith('_job.js')
      },
    })

    return this.#importJobsFromFiles(jobFiles)
  }

  /**
   * Import builtin job files from the package
   */
  async #importBuiltinJobs() {
    const jobFiles = await fsReadAll(new URL('./src/builtin', rootDir), {
      pathType: 'url',
      ignoreMissingRoot: true,
      filter: isScriptFile,
    })

    return this.#importJobsFromFiles(jobFiles)
  }

  /**
   * Import job classes from an array of file paths
   */
  async #importJobsFromFiles(files: (URL | string)[]) {
    const promises = files.map(async (file) => {
      const i = await import(file.toString())
      if (!i.default) return { job: null, file }

      return { job: i.default, file }
    })

    return Promise.all(promises)
  }

  /**
   * Validate that all job names are unique and throw if duplicates are found
   */
  #validateUniqueJobNames(jobs: { job: BaseJobConstructor; file: URL | string }[]) {
    const jobsByName = group(jobs, (i) => i.job.jobName)
    const duplicates = Object.entries(jobsByName)
      .filter(([_, jobs]) => (jobs || []).length > 1)
      .map(([jobName, jobs]) => ({ jobName, jobs }))

    if (duplicates.length > 0) throw new DuplicateJobException(this.#appRoot, duplicates)
  }

  /**
   * Discover and load all job classes from the application
   */
  async discoverJobs(): Promise<BaseJobConstructor[]> {
    const { BaseJob } = await import('./job/base_job.js')

    const appJobs = await this.#importAppJobs()
    const builtinJobs = await this.#importBuiltinJobs()

    const allJobImports = [...appJobs, ...builtinJobs]
    const validJobs = allJobImports
      .filter((i) => i.job && typeof i.job === 'function')
      .filter((i) => i.job.prototype instanceof BaseJob)

    this.#validateUniqueJobNames(validJobs)

    return validJobs.map(({ job }) => job)
  }
}
