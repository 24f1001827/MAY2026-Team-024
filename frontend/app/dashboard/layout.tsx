import { cookies } from "next/headers"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/shadcn/sidebar"
import { Separator } from "@/components/shadcn/separator"
import { TooltipProvider } from "@/components/shadcn/tooltip"
import { AppSidebar } from "@/features/dashboard/components/app-sidebar"
import { Breadcrumbs } from "@/features/common/components/breadcrumbs"
import { ThemeToggle } from "@/features/common/components/theme-toggle"
import { requireUser } from "@/lib/auth/current-user"

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Resolve the signed-in user from the session cookie; no session → login.
  const currentUser = await requireUser()

  // Restore the sidebar's collapsed state from its cookie to avoid a flash.
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar
          user={{
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
          }}
        />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 !h-5" />
            <Breadcrumbs />
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
