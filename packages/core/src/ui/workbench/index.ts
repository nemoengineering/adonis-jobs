import type { RouteGroup } from '@adonisjs/http-server'
import router from '@adonisjs/core/services/router'

import type { Queues } from '../../types/index.ts'
import queueManager from '../../../services/main.ts'

/**
 * Public options exposed by the Workbench wrapper. We omit `queues` (filled in
 * from the Adonis-level queue config) and `basePath` (derived from the matched
 * route pattern at request time) because those are wired by the framework, not
 * by user input.
 *
 * Typed loosely to avoid a hard import of `@getworkbench/core` at type-resolution
 * time — the package is an optional peer dep and may not be installed.
 */
export interface WorkbenchUiOptions {
  /**
   * Optional basic-auth credentials. When set, Workbench's built-in auth gate
   * runs before any handler. Most Adonis users will prefer to skip this and
   * wrap the route group with the framework's own `middleware.auth(...)`.
   */
  auth?: { username: string; password: string }
  /** Dashboard title shown in the nav bar. Defaults to `"Workbench"`. */
  title?: string
  /** Logo URL displayed in the nav bar. */
  logo?: string
  /** When true, mutating endpoints (retry, remove, promote, pause, …) return 403. */
  readonly?: boolean
  /** Fields from `job.data` to extract as filterable tags in the UI. */
  tags?: string[]
}

type WorkbenchModule = typeof import('@getworkbench/core')
type FetchHandler = ReturnType<WorkbenchModule['createFetchHandler']>['fetch']

let workbenchModulePromise: Promise<WorkbenchModule> | undefined

/**
 * Dynamically load `@getworkbench/core`. It is declared as an optional peer
 * dependency so users who stick with the QueueDash UI don't pay the install
 * cost (Workbench ships React/Radix/Recharts/etc — ~1.7MB unpacked).
 */
async function loadWorkbench(): Promise<WorkbenchModule> {
  if (!workbenchModulePromise) {
    workbenchModulePromise = import('@getworkbench/core').catch((err) => {
      workbenchModulePromise = undefined
      throw new Error(
        '[adonis-jobs] @getworkbench/core is not installed. Run `npm i @getworkbench/core` to use the Workbench UI.',
        { cause: err },
      )
    })
  }
  return workbenchModulePromise
}

/**
 * Mount the Workbench BullMQ dashboard as an AdonisJS route group.
 *
 * Queues are pulled from your `config/queue.ts` via the QueueManager — you
 * don't need to pass them in. The mount prefix is whatever you chain
 * `.prefix(...)` onto the returned `RouteGroup`.
 *
 * Internally, this thin shim delegates to `@getworkbench/core`'s
 * `createFetchHandler`, which exposes the dashboard as a Fetch-compatible
 * handler. We translate the Adonis request/response pair into a web `Request`
 * (streaming the raw Node `IncomingMessage` as the body for non-GET/HEAD) and
 * back. All routing, auth, CORS, static assets, and HTML shell rendering live
 * upstream — we just bridge the two transport layers.
 *
 * @example
 * ```ts
 * // start/routes.ts
 * import { workbenchUiRoutes } from '@nemoventures/adonis-jobs/ui/workbench'
 *
 * workbenchUiRoutes().prefix('/admin/workbench')
 * ```
 *
 * @example Built-in basic auth
 * ```ts
 * workbenchUiRoutes({
 *   auth: { username: env.get('WB_USER'), password: env.get('WB_PASS') },
 * }).prefix('/admin/workbench')
 * ```
 *
 * @example Adonis middleware (recommended)
 * ```ts
 * router.group(() => {
 *   workbenchUiRoutes().prefix('/workbench')
 * })
 *   .prefix('/admin')
 *   .use(middleware.auth({ guards: ['basicAuth'] }))
 * ```
 */
export function workbenchUiRoutes(options: WorkbenchUiOptions = {}): RouteGroup {
  // Memoize `{ fetch }` per resolved basePath. Adonis routers normally produce
  // a single concrete pattern per registered handler, so this map will only
  // ever hold one entry in practice — keying by basePath just makes us robust
  // if a user somehow mounts the same group at multiple prefixes.
  const handlerByBase = new Map<string, FetchHandler>()

  async function getFetchHandler(basePath: string): Promise<FetchHandler> {
    const cached = handlerByBase.get(basePath)
    if (cached) return cached

    const wb = await loadWorkbench()
    const queues = Object.keys(queueManager.config.queues).map(
      (name) => queueManager.useQueue(name as keyof Queues) as any,
    )

    const { fetch } = wb.createFetchHandler({
      ...options,
      queues,
      basePath,
    })
    handlerByBase.set(basePath, fetch)
    return fetch
  }

  /**
   * Derive Workbench's `basePath` from the matched Adonis route. The wildcard
   * route registers as `<prefix>/*`; the bare-root route as `<prefix>`. In both
   * cases we want the prefix without trailing slash or wildcard.
   */
  function basePathFromPattern(pattern: string | undefined): string {
    if (!pattern) return '/'
    let p = pattern
    if (p.endsWith('/*')) p = p.slice(0, -2)
    if (p.endsWith('/') && p.length > 1) p = p.slice(0, -1)
    return p || '/'
  }

  async function handle(ctx: import('@adonisjs/core/http').HttpContext) {
    const { request, response, route } = ctx
    const basePath = basePathFromPattern(route?.pattern)
    const fetch = await getFetchHandler(basePath)

    // Build a web-standard Request from the Adonis HTTP context.
    const url = request.completeUrl(true)
    const headers = new Headers()
    for (const [key, value] of Object.entries(request.headers())) {
      if (typeof value === 'string') {
        headers.set(key, value)
      } else if (Array.isArray(value)) {
        for (const entry of value) headers.append(key, entry)
      }
    }

    const method = request.method()
    const init: Record<string, unknown> = { method, headers }
    if (method !== 'GET' && method !== 'HEAD') {
      // Stream the raw Node IncomingMessage. `duplex: 'half'` is mandatory in
      // Node 18+ when passing a ReadableStream or Node stream as the body.
      init.duplex = 'half'
      init.body = request.request
    }

    const webResponse = await fetch(new Request(url, init as RequestInit))

    response.status(webResponse.status)
    webResponse.headers.forEach((value, key) => {
      // `content-length` is reset by Adonis based on the actual buffer length.
      if (key.toLowerCase() === 'content-length') return
      response.header(key, value)
    })
    response.send(Buffer.from(await webResponse.arrayBuffer()))
  }

  return router.group(() => {
    // Two routes: the bare mount and a wildcard catch-all. Both delegate to
    // the same handler — Workbench's internal Hono router does the rest.
    router.any('/', handle)
    router.any('/*', handle)
  })
}
