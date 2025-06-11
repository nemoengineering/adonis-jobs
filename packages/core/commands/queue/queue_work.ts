import { createServer } from 'node:http'
import { Server } from '@adonisjs/http-server'
import { configProvider } from '@adonisjs/core'
import type { Server as NodeServer } from 'node:http'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { LoggerService } from '@adonisjs/core/types'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import type { Queues } from '../../src/types/index.js'
import { WorkerManager } from '../../src/worker/worker_manager.js'
import { JobDiscoverer } from '../../src/worker/job_discoverer.js'

export default class QueueWork extends BaseCommand {
  static commandName = 'queue:work'
  static description = 'Listen for dispatched jobs'

  @flags.array({ name: 'queues', alias: 'q', description: 'The queues you want to listen for' })
  declare queues: (keyof Queues)[]

  @flags.boolean({ name: 'list', alias: 'l', description: 'List all available queues' })
  declare list: boolean

  @flags.boolean({
    alias: 'f',
    description: 'Force exit on shutdown. Do not wait for active jobs to complete',
    default: false,
  })
  declare forceExit: boolean

  @flags.boolean({
    description:
      'Use the router from your AdonisJS app. ( You need to handle healthcheck routes etc. yourself )',
    default: false,
  })
  declare useAppRouter: boolean

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  #manager!: WorkerManager
  #appLogger!: LoggerService
  #server: NodeServer | undefined

  /**
   * Handle graceful shutdown of the worker process.
   * It waits for all actives jobs to complete before exiting if `forceExit` is not set.
   */
  async #handleShutdown() {
    await this.#manager.stopWorkers(this.forceExit)
    if (this.forceExit) this.app.terminating(() => process.exit(0))

    this.#server?.close()
    return this.terminate()
  }

  async prepare() {
    this.#appLogger = await this.app.container.make('logger')
    const emitter = await this.app.container.make('emitter')
    const queueConfigProvider = this.app.config.get('queue')
    const config = await configProvider.resolve<any>(this.app, queueConfigProvider)

    const jobs = await new JobDiscoverer(this.app.appRoot).discoverJobs()
    this.#manager = new WorkerManager(this.app, emitter, config, jobs)

    this.app.listen('SIGINT', () => this.#handleShutdown())
    this.app.listen('SIGTERM', () => this.#handleShutdown())
  }

  async #listQueues() {
    const availableQueues = this.#manager.getAllQueueNames()

    this.ui.logger.log('Available queues')
    const table = this.ui.table().head(['Name'])
    availableQueues.forEach((w) => table.row([w]))
    table.render()

    return await this.terminate()
  }

  async #makeServer() {
    if (this.useAppRouter) {
      this.#appLogger.info('Using app router')
      return await this.app.container.make('server')
    }

    const encryption = await this.app.container.make('encryption')
    const emitter = await this.app.container.make('emitter')
    const config = this.app.config.get<any>('app.http')
    const server = new Server(this.app, encryption, emitter, this.#appLogger, config)

    server.getRouter().get('/internal/healthz', ({ response }) => response.ok('ok'))

    return server
  }

  async #startServer() {
    const server = await this.#makeServer()
    const httpServer = createServer(server.handle.bind(server))
    await server.boot()

    server.setNodeServer(httpServer)

    const host = process.env.HOST || '0.0.0.0'
    const port = Number(process.env.QUEUE_PORT || process.env.PORT || '3333')

    httpServer.once('listening', () =>
      this.#appLogger.info(`listening to http server, host: ${host}, port: ${port}`),
    )

    return httpServer.listen(port, host)
  }

  async run() {
    if (this.list) return this.#listQueues()

    const availableQueues = this.#manager.getAllQueueNames()
    this.queues ??= availableQueues

    this.#appLogger.info({ queues: this.queues }, `Starting workers`)
    this.#server = await this.#startServer()

    await this.#manager.startWorkers(this.queues)
  }
}
