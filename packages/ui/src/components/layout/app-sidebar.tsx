import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  IconChartBar,
  IconDashboard,
  IconListDetails,
  IconFlask,
  IconClock,
  IconBrandGithub,
  IconBook,
  IconExternalLink,
} from '@tabler/icons-react'

import { NavMain } from '@/components/layout/nav-main'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
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
      <SidebarSeparator />
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>{' '}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-2">
              <a
                href="https://github.com/nemoengineering/adonis-jobs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <IconBrandGithub className="!size-4" />
                <span className="text-sm">GitHub</span>
                <IconExternalLink className="!size-3 ml-auto" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-2">
              <a
                href="https://adonis-jobs.nemo.engineering/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <IconBook className="!size-4" />
                <span className="text-sm">Documentation</span>
                <IconExternalLink className="!size-3 ml-auto" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
