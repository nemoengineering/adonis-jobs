import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { createServer } from 'node:http'
import { Server } from '@adonisjs/http-server'
import { LoggerService } from '@adonisjs/core/types'

export default class QueueListen extends BaseCommand {
  static commandName = 'queue:listen'
  static description = 'Listen for jobs dispatched on queues'

  @flags.array({ name: 'jobs', alias: 'j', description: 'The jobs you want to listen for' })
  declare jobs: string[]

  @flags.boolean({ name: 'list', alias: 'l', description: 'List all available jobs' })
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

  #appLogger!: LoggerService

  async prepare() {
    this.#appLogger = await this.app.container.make('logger')
  }

  async run() {
    const queue = await this.app.container.make('job.manager')

    if (this.list) {
      this.ui.logger.log('Available jobs')
      const table = this.ui.table().head(['Name'])
      queue.getAllJobNames().forEach((w) => {
        table.row([w])
      })
      table.render()
      return await this.terminate()
    }

    await this.#startServer()

    if (!this.jobs) {
      this.jobs = queue.getAllJobNames()
    }

    this.#appLogger.info({ queues: this.jobs }, `Staring workers`)
    const runningWorkers = await queue.startWorkers(this.jobs)

    this.app.terminating(async () => {
      this.#appLogger.info('Terminating...')
      await Promise.all(runningWorkers.map((w) => w.close()))
    })
    this.app.listen('SIGINT', () => this.app.terminate())
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

    httpServer.listen(port, host)
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
