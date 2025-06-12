import { HealthChecks } from '@adonisjs/core/health'
import type { RedisService } from '@adonisjs/redis/types'
import { RedisCheck, RedisMemoryUsageCheck } from '@adonisjs/redis'

import type { Config } from '../types/index.js'

export class HealthCheckManager {
  #config: Config
  #redis: RedisService

  constructor(config: Config<any>, redis: RedisService) {
    this.#config = config
    this.#redis = redis
  }

  /**
   * Create default health checks for all used Redis connections
   */
  #createDefaultChecks() {
    const connections = this.#getUsedRedisConnections()

    return connections.flatMap((connectionName) => [
      new RedisCheck(this.#redis.connection(connectionName)),
      new RedisMemoryUsageCheck(this.#redis.connection(connectionName)),
    ])
  }

  /**
   * Get unique Redis connection names used by the active queues
   */
  #getUsedRedisConnections(): string[] {
    const connections = new Set<string>()

    if (this.#config.connection?.connectionName) {
      connections.add(this.#config.connection.connectionName)
    }

    Object.values(this.#config.queues).forEach((queueConfig) => {
      if (queueConfig?.connection?.connectionName) {
        connections.add(queueConfig.connection.connectionName)
      }
    })

    return Array.from(connections)
  }

  /**
   * Create health checks based on configuration
   */
  createHealthChecks(): HealthChecks | null {
    if (!this.#config.healthCheck?.enabled) return null

    const healthChecks = new HealthChecks()

    if (this.#config.healthCheck.checks) {
      const usedConnections = this.#getUsedRedisConnections()
      const checks = usedConnections.flatMap((connectionName) => {
        const connection = this.#redis.connection(connectionName)
        return this.#config.healthCheck!.checks!({ connection })
      })

      healthChecks.register(checks)
      return healthChecks
    }

    const defaultChecks = this.#createDefaultChecks()
    healthChecks.register(defaultChecks)

    return healthChecks
  }

  /**
   * Get the health check endpoint path
   */
  getEndpoint(): string {
    return this.#config.healthCheck?.endpoint || '/internal/healthz'
  }
}
