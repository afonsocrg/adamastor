"use client"

import * as React from "react"
import {
  Bot,
  CalendarIcon,
  Command,
  DatabaseIcon,
  Frame,
  Map,
  NewspaperIcon,
  PieChart,
} from "lucide-react"

import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/tailwind/ui/sidebar'
// Import your actual type instead of creating a custom one
import type { UserWithProfile } from '@/lib/supabase/authentication'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  profile?: UserWithProfile // Use your actual type
}

export function AppSidebar({ profile, ...props }: AppSidebarProps) {
  // Create user data from profile, with fallback to existing data
  // Handle optional email with safe navigation
  const userData = profile ? {
    name: profile.email?.split('@')[0] || 'User', // Safe navigation for optional email
    email: profile.email || 'user@example.com',  // Provide fallback for optional email
    avatar: "/avatars/shadcn.jpg",
  } : {
    name: "shadcn",
    email: "m@example.com", 
    avatar: "/avatars/shadcn.jpg",
  }

  const data = {
    user: userData,
    navMain: [
      {
        title: "Posts",
        url: "/dashboard/posts",
        icon: NewspaperIcon,
        isActive: true,
        items: [
          {
            title: "My Posts",
            url: "/dashboard/posts",
          },
          {
            title: "Other's Posts",
            url: "/dashboard/posts",
          },                 
        ],
      },
      {
        title: "Events",
        url: "/dashboard/add-event",
        icon: Bot,
      },
      {
        title: "Calendar",
        url: "/dashboard/calendar",
        icon: CalendarIcon,
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: DatabaseIcon,
      },                  
    ],
    navSecondary: [],
    projects: [
      {
        name: "Design Engineering",
        url: "#",
        icon: Frame,
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: PieChart,
      },
      {
        name: "Travel",
        url: "#",
        icon: Map,
      },
    ],
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#1DCEDB] text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Adamastor</span>
                 
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />                 
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}