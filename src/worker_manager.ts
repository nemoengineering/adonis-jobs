import { ApplicationService } from '@adonisjs/core/types'
import { fsReadAll, isScriptFile, RuntimeException } from '@poppinss/utils'
import { Job } from './job.js'
import { Config, QueueConfig, Queues } from './types.js'
import { Worker as BullWorker } from 'bullmq'

export class WorkerManager<KnownQueues extends Record<string, QueueConfig> = Queues> {
  readonly #app: ApplicationService
  //readonly #emitter: EmitterLike<JobEvents>

  readonly #jobs: Map<string, typeof Job>
  #runningWorkers: BullWorker[] = []

  constructor(
    app: ApplicationService,
    //emitter: EmitterLike<JobEvents>,
    public config: Config<KnownQueues>,
    jobs: (typeof Job)[]
  ) {
    this.#app = app
    //this.#emitter = emitter
    this.#jobs = new Map(jobs.map((j) => [j.name, j]))
  }

  getAllQueueNames() {
    return Object.keys(this.config.queues) as (keyof KnownQueues)[]
  }

  async startWorkers(queueNames: (keyof KnownQueues)[]) {
    this.#runningWorkers = await Promise.all(queueNames.map((w) => this.#startWorker(w)))
  }

  async stopWorkers() {
    await Promise.all(this.#runningWorkers.map((w) => w.close()))
  }

  async #startWorker(queueName: keyof KnownQueues) {
    const loggerService = await this.#app.container.make('logger')
    const logger = loggerService.child({ queueName })

    const worker = new BullWorker(
      String(queueName),
      async (job, token) => {
        const JobClass = this.#getJobClass(job.name)

        const jobInstance = await this.#app.container.make(JobClass)
        jobInstance.$setJob(job, token, logger)
        jobInstance.$setWorker(worker)

        jobInstance.logger.info('Starting job')

        const res = this.#app.container.call(jobInstance, 'process')
        //void this.#emitter.emit('job:started', { jobName: job.name, job })
        return await res
      },
      { connection: this.config.connection, ...this.config.queues[queueName].defaultWorkerOptions }
    )

    worker.on('failed', async (job, error, token) => {
      if (!job) {
        logger.error(error.message, 'Job failed')
        return
      }
      //void this.#emitter.emit('job:error', { jobName: job.name, job, error })

      const JobClass = this.#getJobClass(job.name)
      const jobInstance = await this.#app.container.make(JobClass)
      jobInstance.$setJob(job, token, logger)
      jobInstance.$setError(error)

      try {
        await this.#app.container.call(jobInstance, 'onFailed')
      } catch (e) {
        logger.error(e)
      }

      if (jobInstance.allAttemptsMade()) {
        //void this.#emitter.emit('job:failed', { jobName: job.name, job, error })
      }
    })

    worker.on('completed', (_job) => {
      //this.#emitter.emit('job:success', { jobName: job.name, job })
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
