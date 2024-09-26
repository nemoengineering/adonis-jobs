import { ApplicationService } from '@adonisjs/core/types'
import { fsReadAll, isScriptFile, RuntimeException } from '@poppinss/utils'
import { Job } from './job.js'
import { Config, JobEvents, QueueConfig } from './types.js'
import { Worker as BullWorker } from 'bullmq/dist/esm/classes/worker.js'
import { EmitterLike } from '@adonisjs/core/types/events'
import logger from '@adonisjs/core/services/logger'

export class WorkerManager<KnownQueues extends Record<string, QueueConfig>> {
  readonly #app: ApplicationService
  readonly #emitter: EmitterLike<JobEvents>

  readonly #jobs: Map<string, typeof Job>

  constructor(
    app: ApplicationService,
    emitter: EmitterLike<JobEvents>,
    public config: Config<KnownQueues>,
    jobs: (typeof Job)[]
  ) {
    this.#app = app
    this.#emitter = emitter

    this.#jobs = new Map(jobs.map((j) => [j.name, j]))
  }

  async startWorkers(queueNames: (keyof KnownQueues)[]) {
    return Promise.all(queueNames.map((w) => this.#startWorker(w)))
  }

  async #startWorker(queueName: keyof KnownQueues) {
    const worker = new BullWorker(String(queueName), async (job, token) => {
      const JobClass = this.#getJobClass(job.name)

      const jobInstance = await this.#app.container.make(JobClass)
      jobInstance.$setJob(job, token)
      jobInstance.$setWorker(worker)

      jobInstance.logger.info('Starting job')

      const res = this.#app.container.call(jobInstance, 'process')
      //void this.#emitter.emit('job:started', { jobName: job.name, job })
      return await res
    })

    worker.on('failed', async (job, error) => {
      if (!job) {
        logger.error(error.message, 'Job failed')
        return
      }
      //void this.#emitter.emit('job:error', { jobName: job.name, job, error })

      const JobClass = this.#getJobClass(job.name)
      const jobInstance = await this.#app.container.make(JobClass)
      jobInstance.$setJob(job)
      jobInstance.$setError(error)

      try {
        await this.#app.container.call(jobInstance, 'onFailed')
      } catch (e) {
        logger.error(e)
      }

      if (jobInstance.allAttemptsMade()) {
        void this.#emitter.emit('job:failed', { jobName: job.name, job, error })
      }
    })

    worker.on('completed', (job) => {
      this.#emitter.emit('job:success', { jobName: job.name, job })
    })

    return worker
  }

  #getJobClass(jobName: string) {
    const JobClass = this.#jobs.get(jobName)
    if (!JobClass)
      throw new RuntimeException(
        `Unknown job "${String(jobName)}". Make sure it is configured inside the config file`
      )
    return JobClass
  }

  static async loadJobs(app: ApplicationService) {
    const jobPath = app.makePath(app.rcFile.directories['jobs'])
    const files = await fsReadAll(jobPath, {
      pathType: 'url',
      ignoreMissingRoot: true,
      filter: isScriptFile,
    })

    const imports = await Promise.all(
      files.map(async (file) => {
        const i = await import(file)
        if (!i.default) return
        return i.default
      })
    )

    // TODO: check for duplicate job names
    return imports.filter((i) => {
      if (typeof i !== 'function') return false
      return i.prototype instanceof Job
    }) as (typeof Job)[]
  }
}
