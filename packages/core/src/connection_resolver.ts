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
   * Resolve a connection configuration to BullMQ connection options.
   *
   * Applies role-specific IORedis defaults following BullMQ production
   * recommendations: queues should fail fast while workers should be
   * resilient to temporary disconnections.
   */
  resolve(options?: {
    config?: QueueConnectionConfig
    role?: 'queue' | 'worker'
  }): BullConnectionOptions {
    const connectionConfig = options?.config ?? this.config.connection
    const role = options?.role ?? 'queue'

    const redisConnection = this.redis.connection(
      connectionConfig.connectionName,
    ) as any as RedisConnection

    if (this.#useSharedConnection) return redisConnection.ioConnection as any

    /**
     * For non-shared connections, we return the connection options
     * in order to let BullMQ create a new IORedis instance.
     *
     * We apply different defaults based on the role:
     * - Queue: disable offline queue so calls fail fast during disconnections
     * - Worker: set maxRetriesPerRequest to null (required by BullMQ)
     */
    const ioConnection = redisConnection.ioConnection

    if (role === 'worker') {
      return { ...ioConnection.options, maxRetriesPerRequest: null }
    }

    return { ...ioConnection.options, enableOfflineQueue: false }
  }
}
