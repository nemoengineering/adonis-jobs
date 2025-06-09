import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { appRouter } from '@queuedash/api'
import type { Context } from '@queuedash/api'
import router from '@adonisjs/core/services/router'
import { resolveResponse } from '@trpc/server/http'
import type { RouteGroup } from '@adonisjs/http-server'

import { createQueueDashHtml } from './html.js'
import type { Queues } from '../../types/index.js'
import queueManager from '../../../services/main.js'

export function queueDashUiRoutes(): RouteGroup {
  const mainJS = readFileSync(fileURLToPath(import.meta.resolve('@queuedash/client/dist/main.mjs')))
  const style = readFileSync(fileURLToPath(import.meta.resolve('@queuedash/ui/dist/styles.css')))

  return router.group(() => {
    router.any('/trpc/*', async ({ request, response }) => {
      const path = request.url().split('/trpc/')[1]
      const url = new URL(request.completeUrl(true))

      const queues = queueManager.config.queues

      const req = new Request(url, {
        headers: request.headers() as Record<string, string | ReadonlyArray<string>>,
        body: request.raw(),
        method: request.method(),
      })

      const trpcResponse = await resolveResponse({
        createContext: async () => ({
          queues: Object.keys(queues).reduce(
            (acc, queueName) => {
              acc.push({
                queue: queueManager.useQueue(queueName as keyof Queues),
                displayName: queueName,
                type: 'bullmq' as const,
              })

              return acc
            },
            [] as Context['queues'],
          ),
        }),
        router: appRouter,
        path,
        req,
        error: null,
      })

      const trpcResponseText = await trpcResponse.text()

      trpcResponse.headers.forEach((value, key) => {
        response.header(key, value)
      })

      response.status(trpcResponse.status)
      response.send(trpcResponseText)
    })

    router.get('main.mjs', async ({ response }) => {
      response.type('application/javascript').send(mainJS)
    })

    router.get('styles.css', async ({ response }) => {
      response.type('text/css').send(style)
    })

    router.get('/', ({ response, route }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      const baseUrl = router.builder().params(route?.meta?.params).make(route?.pattern!)
      response.type('text/html').send(createQueueDashHtml(baseUrl))
    })

    router.get('/*', ({ response, route }) => {
      const patternWithoutWildcard = route?.pattern.slice(0, -2)
      const baseUrl = router.builder().params(route?.meta?.params).make(patternWithoutWildcard!)

      response.type('text/html').send(createQueueDashHtml(baseUrl))
    })
  })
}
