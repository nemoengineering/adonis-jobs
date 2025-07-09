import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  IconChartBar,
  IconDashboard,
  IconListDetails,
  IconFlask,
  IconClock,
} from '@tabler/icons-react'

import { NavMain } from '@/components/layout/nav-main'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const data = {
  navMain: [
    { title: 'Overview', url: '/overview', icon: IconDashboard },
    { title: 'Queues', url: '/queues', icon: IconListDetails },
    { title: 'Schedules', url: '/schedules', icon: IconClock },
    { title: 'Runs', url: '/runs', icon: IconChartBar },
    { title: 'Test', url: '/test', icon: IconFlask },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/overview">
                <IconChartBar className="!size-5" />
                <span className="text-base font-semibold">Jobs Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  )
}
