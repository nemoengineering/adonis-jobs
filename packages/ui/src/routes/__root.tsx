import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Outlet, createRootRouteWithContext, useMatches } from '@tanstack/react-router'

import { cn } from '@/lib/utils'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: () => {
    const matches = useMatches()
    const isFullScreenMode = matches.some((match) => match.staticData?.fullScreenMode)

    return (
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 60)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="sidebar" />
        <SidebarInset>
          <div className="flex flex-1 flex-col">
            <div
              className={cn(
                '@container/main overflow-hidden flex flex-1 flex-col border',
                isFullScreenMode && 'max-h-screen',
              )}
            >
              <Outlet />
            </div>
          </div>
        </SidebarInset>
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </SidebarProvider>
    )
  },
})
