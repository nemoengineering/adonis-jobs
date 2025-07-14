/// <reference types="@adonisjs/redis/redis_provider" />

import { createServer } from 'node:http'
import { Server } from '@adonisjs/http-server'
import { configProvider } from '@adonisjs/core'
import type { Server as NodeServer } from 'node:http'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { LoggerService } from '@adonisjs/core/types'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import JobProvider from '../../providers/queue_provider.js'
import type { Config, Queues } from '../../src/types/index.js'
import { WorkerManager } from '../../src/worker/worker_manager.js'
import { JobDiscoverer } from '../../src/worker/job_discoverer.js'
import { ConnectionResolver } from '../../src/connection_resolver.js'
import { HealthCheckManager } from '../../src/health/health_check_manager.js'

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
  #healthCheckManager!: HealthCheckManager
  #config!: Config
  #server: NodeServer | undefined

  /**
   * Handle graceful shutdown of the worker process.
   * It waits for all actives jobs to complete before exiting if `forceExit` is not set.
   */
  async #handleShutdown() {
    this.#appLogger.info(
      `Received shutdown signal, stopping workers${
        this.forceExit ? ' (force exit enabled)' : ' (waiting for active jobs to complete)'
      }...`,
    )

    await this.#manager.stopWorkers(this.forceExit)
    if (this.forceExit) this.app.terminating(() => process.exit(0))

    this.#server?.close()

    // Wait to allow event handlers to finish work
    await new Promise((res) => setTimeout(res, 2000))
    const manager = await this.app.container.make('queue.manager')
    await manager.shutdown()

    await this.terminate()

    this.#appLogger.info(`All workers stopped. Good bye!`)
  }

  async prepare() {
    this.#config = (await configProvider.resolve(this.app, this.app.config.get('queue')))!
    this.#appLogger = await this.app.container.make('logger')

    const emitter = await this.app.container.make('emitter')
    const redis = await this.app.container.make('redis')

    const jobs = await new JobDiscoverer(this.app.appRoot).discoverAndLoadJobs()
    const resolver = new ConnectionResolver(this.#config, redis)

    this.#manager = new WorkerManager(this.app, emitter, this.#config as any, jobs, resolver)
    this.#healthCheckManager = new HealthCheckManager(this.#config, redis)

    this.app.listen('SIGINT', () => this.#handleShutdown())
    this.app.listen('SIGTERM', () => this.#handleShutdown())
  }

  async #listQueues() {
    const availableQueues = this.#manager.getAllQueueNames()

    this.ui.logger.log('Available queues')
    const table = this.ui.table().head(['Name'])
    availableQueues.forEach((w) => table.row([String(w)]))
    table.render()

    return await this.terminate()
  }

  async #addHealthEndpoint(server: Server) {
    const healthChecks = this.#healthCheckManager.createHealthChecks()
    if (!healthChecks) return

    const router = server.getRouter()
    const healthEndpoint = this.#healthCheckManager.getEndpoint()

    router.get(healthEndpoint, async ({ response }) => {
      const report = await healthChecks.run()
      if (report.isHealthy) return response.ok(report)

      return response.serviceUnavailable(report)
    })
  }

  async #addMetricsEndpoint(server: Server) {
    const config = this.#config.metrics
    if (!config?.enabled) return

    const { PrometheusMetricController } = await import(
      '@julr/adonisjs-prometheus/controllers/prometheus_metric_controller'
    )

    const router = server.getRouter()
    const metricsEndpoint = config.endpoint || this.app.config.get<string>('prometheus.endpoint')

    router.get(metricsEndpoint, [PrometheusMetricController, 'handle']).as('prometheus.metrics')
  }

  async #makeServer() {
    if (this.useAppRouter) {
      this.#appLogger.info('Using app router')
      return await this.app.container.make('server')
    }

    const server = new Server(
      this.app,
      await this.app.container.make('encryption'),
      await this.app.container.make('emitter'),
      this.#appLogger,
      this.app.config.get<any>('app.http'),
    )

    await this.#addHealthEndpoint(server)
    await this.#addMetricsEndpoint(server)

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

    const logger = this.#appLogger

    process.on('uncaughtException', function (err) {
      logger.error(err, 'Uncaught exception')
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.child(promise).error(reason, 'Unhandled Rejection at: Promise')
    })

    JobProvider.isWorkerCommand = true
    await this.#manager.startWorkers(this.queues)
  }
}
