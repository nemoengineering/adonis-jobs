import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class Cleanup extends BaseCommand {
  static commandName = 'cleanup'
  static description = ''

  @flags.boolean({ description: 'Force cleanup' })
  declare force: boolean

  static options: CommandOptions = {}

  async run() {
    this.logger.info(`Force cleanup is ${this.force ? 'enabled' : 'disabled'}`)
  }
}
