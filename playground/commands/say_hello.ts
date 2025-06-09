import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class SayHello extends BaseCommand {
  static commandName = 'say:hello'
  static description = ''

  static options: CommandOptions = {}

  async run() {
    const now = new Date()
    this.logger.info('Hello world from "SayHello" at ' + now.toISOString())
  }
}
