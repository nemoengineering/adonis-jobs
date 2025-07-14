import './styles.css'

import dayjs from 'dayjs'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createHashHistory, RouterProvider, createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

dayjs.extend(relativeTime)
dayjs.extend(duration)

const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
  history: createHashHistory(),
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }

  interface StaticDataRouteOption {
    fullScreenMode?: boolean
  }
}

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

declare global {
  interface Window {
    __JOB_DASHBOARD_OPTS__: {
      baseUrl: string
    }
  }
}

window.__JOB_DASHBOARD_OPTS__ ||= { baseUrl: 'http://localhost:3333' }
