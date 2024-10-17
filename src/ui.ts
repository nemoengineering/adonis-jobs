import router from '@adonisjs/core/services/router'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { appRouter, Context } from '@queuedash/api'
import { resolveHTTPResponse } from '@trpc/server/http'
import queueManager from '../services/main.js'
import { Queues } from './types.js'
import { RouteGroup } from '@adonisjs/http-server'

export function queueUiRoutes(): RouteGroup {
  const mainJS = readFileSync(fileURLToPath(import.meta.resolve('@queuedash/client/dist/main.mjs')))
  const style = readFileSync(fileURLToPath(import.meta.resolve('@queuedash/ui/dist/styles.css')))

  return router.group(() => {
    router.any('/trpc/*', async ({ request, response }) => {
      const path = request.url().split('/trpc/')[1]
      const url = new URL(request.completeUrl(true))

      const queues = queueManager.config.queues

      const { body, status, headers } = await resolveHTTPResponse({
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
            [] as Context['queues']
          ),
        }),
        router: appRouter,
        path,
        req: {
          query: url.searchParams,
          method: request.method(),
          headers: request.headers(),
          body: request.body(),
        },
      })
      if (headers) {
        Object.keys(headers).forEach((key) => {
          const value = headers[key]
          if (value) response.header(key, value)
        })
      }
      response.status(status)
      response.send(body)
    })

    router.get('main.mjs', async ({ response }) => {
      response.type('application/javascript').send(mainJS)
    })
    router.get('styles.css', async ({ response }) => {
      response.type('text/css').send(style)
    })

    router.get('/', ({ response, route }) => {
      const baseUrl = router.builder().params(route?.meta?.params).make(route?.pattern!)
      response.type('text/html').send(createQueuedashHtml(baseUrl))
    })
    router.get('/*', ({ response, route }) => {
      const patternWithoutWildcard = route?.pattern.slice(0, -2)
      const baseUrl = router.builder().params(route?.meta?.params).make(patternWithoutWildcard!)

      response.type('text/html').send(createQueuedashHtml(baseUrl))
    })
  })
}

const createQueuedashHtml = (baseUrl: string) =>
  `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>QueueDash App</title>
      </head>
      <body>
        <div id="root"></div>
        <script>
          window.__INITIAL_STATE__ = {
            apiUrl: '${baseUrl}/trpc',
            basename: '${baseUrl}',
          }
        </script>
        <link rel="stylesheet" href="${baseUrl}/styles.css" />
        <script type="module" src="${baseUrl}/main.mjs"></script>
      </body>
    </html>`
