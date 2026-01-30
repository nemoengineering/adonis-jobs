import type { RedisConnection } from '@adonisjs/redis'
import type { RedisService } from '@adonisjs/redis/types'

import type { BullConnectionOptions, Config, QueueConnectionConfig } from './types/index.js'

export class ConnectionResolver {
  #useSharedConnection = false

  constructor(
    private config: Config<any>,
    private redis: RedisService,
  ) {
    this.#useSharedConnection = config.useSharedConnection ?? false
  }

  /**
   * Resolve a connection configuration to BullMQ connection options
   */
  resolve(connectionConfig?: QueueConnectionConfig): BullConnectionOptions {
    if (!connectionConfig) connectionConfig = this.config.connection

    const redisConnection = this.redis.connection(
      connectionConfig.connectionName,
    ) as any as RedisConnection

    if (this.#useSharedConnection) return redisConnection.ioConnection as any

    /**
     * For non-shared connections, we return the connection options
     * in order to let BullMQ create a new IORedis instance.
     */
    const ioConnection = redisConnection.ioConnection
    return { ...ioConnection.options, maxRetriesPerRequest: null }
  }
}
