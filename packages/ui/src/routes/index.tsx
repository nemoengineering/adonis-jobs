import { createFileRoute } from '@tanstack/react-router'

import data from '../app/dashboard/data.json'
import { DataTable } from '@/components/data-table'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SectionCards } from '@/components/section-cards'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ChartAreaInteractive } from '@/components/chart-area-interactive'

export const Route = createFileRoute('/')({
  component: App,
})

export default function App() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        {/* <SiteHeader /> */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
