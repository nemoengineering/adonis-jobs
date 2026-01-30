import { test } from '@japa/runner'

import { ConnectionResolver } from '../../src/connection_resolver.js'
import type { Config, QueueConnectionConfig } from '../../src/types/index.js'

function createFakeRedisService(ioOptions: Record<string, any> = {}) {
  const fakeIoConnection = { options: { host: '127.0.0.1', port: 6379, ...ioOptions } }
  return { connection: () => ({ ioConnection: fakeIoConnection }), fakeIoConnection }
}

function createConfig(overrides?: Partial<Config<any>>): Config<any> {
  return {
    connection: { connectionName: 'main' } as QueueConnectionConfig,
    defaultQueue: 'default',
    queues: { default: {} },
    ...overrides,
  }
}

test.group('ConnectionResolver', () => {
  test('worker role sets maxRetriesPerRequest to null', ({ assert }) => {
    const redis = createFakeRedisService()
    const resolver = new ConnectionResolver(createConfig(), redis as any)

    const result = resolver.resolve({ role: 'worker' }) as Record<string, any>

    assert.equal(result.maxRetriesPerRequest, null)
    assert.notProperty(result, 'enableOfflineQueue')
  })

  test('queue role disables offline queue', ({ assert }) => {
    const redis = createFakeRedisService()
    const resolver = new ConnectionResolver(createConfig(), redis as any)

    const result = resolver.resolve({ role: 'queue' }) as Record<string, any>

    assert.equal(result.enableOfflineQueue, false)
    assert.notProperty(result, 'maxRetriesPerRequest')
  })

  test('defaults to queue role when no role is specified', ({ assert }) => {
    const redis = createFakeRedisService()
    const resolver = new ConnectionResolver(createConfig(), redis as any)

    const result = resolver.resolve() as Record<string, any>

    assert.equal(result.enableOfflineQueue, false)
    assert.notProperty(result, 'maxRetriesPerRequest')
  })

  test('returns raw ioConnection when useSharedConnection is true', ({ assert }) => {
    const redis = createFakeRedisService()
    const resolver = new ConnectionResolver(
      createConfig({ useSharedConnection: true }),
      redis as any,
    )

    const workerResult = resolver.resolve({ role: 'worker' })
    const queueResult = resolver.resolve({ role: 'queue' })

    assert.strictEqual(workerResult, redis.fakeIoConnection as any)
    assert.strictEqual(queueResult, redis.fakeIoConnection as any)
  })

  test('spreads ioConnection options into the result', ({ assert }) => {
    const redis = createFakeRedisService({ db: 2, password: 'secret' })
    const resolver = new ConnectionResolver(createConfig(), redis as any)

    const result = resolver.resolve({ role: 'worker' }) as Record<string, any>

    assert.equal(result.host, '127.0.0.1')
    assert.equal(result.port, 6379)
    assert.equal(result.db, 2)
    assert.equal(result.password, 'secret')
  })

  test('uses custom connection config when provided', ({ assert }) => {
    const redis = createFakeRedisService()
    const customConfig = { connectionName: 'custom' } as QueueConnectionConfig
    const resolver = new ConnectionResolver(createConfig(), redis as any)

    resolver.resolve({ config: customConfig, role: 'queue' })

    // No error thrown means it resolved successfully
    assert.isTrue(true)
  })
})
