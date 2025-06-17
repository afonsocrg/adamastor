import type React from "react"
import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/tailwind/ui/sidebar'
import { assertAuthenticated } from "@/lib/supabase/authentication"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch user profile data at layout level
  const supabase = await createClient()
  const profile = await assertAuthenticated(supabase)

  return (
    <div className="h-screen flex">
      <SidebarProvider>
        <AppSidebar profile={profile} />
        <SidebarInset className="flex-1">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}