import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { createServer, Server as NodeServer } from 'node:http'
import { Server } from '@adonisjs/http-server'
import { LoggerService } from '@adonisjs/core/types'
import { Worker } from 'bullmq'
import { JobService } from '../src/types.js'

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
  #server: NodeServer | undefined
  #runningWorkers: Worker[] = []
  #queue!: JobService

  async prepare() {
    this.#appLogger = await this.app.container.make('logger')
    this.#queue = await this.app.container.make('job.manager')

    this.app.terminating(async () => {
      this.#appLogger.info('Terminating...')
      await Promise.all(this.#runningWorkers.map((w) => w.close()))
      await this.#queue.shutdown()
      this.#server?.close()
    })
    this.app.listen('SIGINT', () => this.terminate())
  }

  async run() {
    if (this.list) {
      this.ui.logger.log('Available jobs')
      const table = this.ui.table().head(['Name'])
      this.#queue.getAllJobNames().forEach((w) => {
        table.row([w])
      })
      table.render()
      return await this.terminate()
    }

    this.#server = await this.#startServer()

    if (!this.jobs) {
      this.jobs = this.#queue.getAllJobNames()
    }

    this.#appLogger.info({ queues: this.jobs }, `Staring workers`)
    this.#runningWorkers = (await this.#queue.startWorkers(this.jobs)) as unknown as Worker[]
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
