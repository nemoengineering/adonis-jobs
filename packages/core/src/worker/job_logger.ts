import { Logger } from '@adonisjs/core/logger'

import type { BullJob } from '../types/index.js'

/**
 * Combined logger that sends logs to both Pino (AdonisJS) and BullMQ
 */
export class JobLogger extends Logger<any> {
  #adonisLogger: Logger
  #bullJob: BullJob
  #logToBullMQ: boolean

  constructor(options: {
    adonisLogger: Logger
    bullJob: BullJob
    options: { logToBullMQ: boolean }
  }) {
    super({}, options.adonisLogger.pino)

    this.#adonisLogger = options.adonisLogger
    this.#bullJob = options.bullJob
    this.#logToBullMQ = options.options.logToBullMQ
  }

  /**
   * Helper to serialize complex objects to string for BullMQ
   */
  #serialize(data: any): string {
    if (typeof data === 'string') return data
    if (data instanceof Error) return `${data.name}: ${data.message}\n${data.stack}`

    try {
      return JSON.stringify(data, this.#jsonReplacer, 2)
    } catch {
      return String(data)
    }
  }

  /**
   * JSON replacer function to handle special objects like Error, Date, etc.
   */
  #jsonReplacer = (_key: string, value: any): any => {
    if (value instanceof Error) return JSON.stringify(value, Object.getOwnPropertyNames(value))
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'bigint') return value.toString()
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`
    if (value === undefined) return '[undefined]'

    return value
  }

  /**
   * Helper to format log message with additional data
   */
  #formatMessage(message: string, data?: any): string {
    if (!data) return message

    const serializedData = this.#serialize(data)
    return `${message}\n${serializedData}`
  }

  /**
   * Generic log method that handles both Pino and BullMQ logging
   */
  #log(level: string, mergingObjectOrMessage: any, message?: string, ...values: any[]): void {
    const pinoLogMethod = this.#adonisLogger[level as keyof Logger] as (...args: any[]) => void

    /**
     * Called as level(message, ...values)
     */
    if (typeof mergingObjectOrMessage === 'string') {
      pinoLogMethod.call(this.#adonisLogger, mergingObjectOrMessage, ...values)

      if (!this.#logToBullMQ) return
      const prefix = level.toUpperCase()
      this.#bullJob.log(`${prefix}: ${mergingObjectOrMessage}`)

      return
    }

    /**
     * Called as level(mergingObject, message, ...values)
     */
    pinoLogMethod.call(this.#adonisLogger, mergingObjectOrMessage, message, ...values)

    if (!this.#logToBullMQ) return
    const prefix = level.toUpperCase()
    this.#bullJob.log(`${prefix}: ${this.#formatMessage(message || '', mergingObjectOrMessage)}`)
  }

  info(mergingObject: any, message?: string, ...values: any[]): void
  info(message: string, ...values: any[]): void
  info(mergingObjectOrMessage: any, message?: string, ...values: any[]): void {
    this.#log('info', mergingObjectOrMessage, message, ...values)
  }

  error(mergingObject: any, message?: string, ...values: any[]): void
  error(message: string, ...values: any[]): void
  error(mergingObjectOrMessage: any, message?: string, ...values: any[]): void {
    this.#log('error', mergingObjectOrMessage, message, ...values)
  }

  warn(mergingObject: any, message?: string, ...values: any[]): void
  warn(message: string, ...values: any[]): void
  warn(mergingObjectOrMessage: any, message?: string, ...values: any[]): void {
    this.#log('warn', mergingObjectOrMessage, message, ...values)
  }

  debug(mergingObject: any, message?: string, ...values: any[]): void
  debug(message: string, ...values: any[]): void
  debug(mergingObjectOrMessage: any, message?: string, ...values: any[]): void {
    this.#log('debug', mergingObjectOrMessage, message, ...values)
  }

  trace(mergingObject: any, message?: string, ...values: any[]): void
  trace(message: string, ...values: any[]): void
  trace(mergingObjectOrMessage: any, message?: string, ...values: any[]): void {
    this.#log('trace', mergingObjectOrMessage, message, ...values)
  }

  fatal(mergingObject: any, message?: string, ...values: any[]): void
  fatal(message: string, ...values: any[]): void
  fatal(mergingObjectOrMessage: any, message?: string, ...values: any[]): void {
    this.#log('fatal', mergingObjectOrMessage, message, ...values)
  }

  /**
   * Create a child logger
   */
  child(bindings: Record<string, any>): JobLogger {
    const childPinoLogger = this.#adonisLogger.child(bindings)
    return new JobLogger({
      adonisLogger: childPinoLogger,
      bullJob: this.#bullJob,
      options: { logToBullMQ: this.#logToBullMQ },
    })
  }
}
