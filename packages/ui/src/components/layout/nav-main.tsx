import { Link } from '@tanstack/react-router'
import { type Icon } from '@tabler/icons-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavMain({ items }: { items: { title: string; url: string; icon?: Icon }[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <Link
                  to={item.url}
                  activeProps={{
                    className: '!text-primary border !bg-sidebar-primary !border-border',
                  }}
                  className="flex items-center gap-2 border border-transparent"
                >
                  {({ isActive }) => (
                    <>
                      {item.icon && <item.icon className={isActive ? 'text-primary' : ''} />}
                      <span>{item.title}</span>
                    </>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
