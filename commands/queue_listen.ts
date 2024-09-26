import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { createServer, Server as NodeServer } from 'node:http'
import { Server } from '@adonisjs/http-server'
import { LoggerService } from '@adonisjs/core/types'
import { configProvider } from '@adonisjs/core'
import { WorkerManager } from '../src/worker_manager.js'
import { Queues } from '../src/types.js'

export default class QueueListen extends BaseCommand {
  static commandName = 'queue:listen'
  static description = 'Listen for jobs dispatched on queues'

  @flags.array({ name: 'queues', alias: 'q', description: 'The queues you want to listen for' })
  declare queues: (keyof Queues)[]

  @flags.boolean({ name: 'list', alias: 'l', description: 'List all available queues' })
  declare list: boolean

  @flags.boolean({
    description:
      'Use the router from your adonis app. (You need to handle healthcheck routes etc. yourself)',
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

  async prepare() {
    this.#appLogger = await this.app.container.make('logger')

    const queueConfigProvider = await this.app.config.get('queue')
    const config = await configProvider.resolve<any>(this.app, queueConfigProvider)
    const jobs = await WorkerManager.loadJobs(this.app)
    this.#manager = new WorkerManager(this.app, config, jobs)

    this.app.terminating(async () => {
      this.#appLogger.info('Terminating...')
      await this.#manager.stopWorkers()
      this.#server?.close()
    })
    this.app.listen('SIGINT', () => this.terminate())
  }

  async run() {
    const availableQueues = this.#manager.getAllQueueNames()
    if (this.list) {
      this.ui.logger.log('Available queues')
      const table = this.ui.table().head(['Name'])
      availableQueues.forEach((w) => {
        table.row([w])
      })
      table.render()
      return await this.terminate()
    }
    this.#appLogger.info({ queues: this.queues }, `Staring workers`)

    this.queues ??= availableQueues
    this.#server = await this.#startServer()

    await this.#manager.startWorkers(this.queues)
  }

  async #startServer() {
    const server = await this.#makeServer()
    const httpServer = createServer(server.handle.bind(server))
    await server.boot()

    server.setNodeServer(httpServer)

    const host = process.env.HOST || '0.0.0.0'
    const port = Number(process.env.QUEUE_PORT || process.env.PORT || '3333')

    httpServer.once('listening', () => {
      this.#appLogger.info(`listening to http server, host: ${host}, port: ${port}`)
    })

    return httpServer.listen(port, host)
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

    server.getRouter().get('/internal/healthz', ({ response }) => {
      return response.ok('ok')
    })

    return server
  }
}
