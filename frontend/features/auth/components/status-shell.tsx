"use client"

import { Suspense } from "react"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/shadcn/sidebar"
import { Separator } from "@/components/shadcn/separator"
import { TooltipProvider } from "@/components/shadcn/tooltip"
import { ThemeToggle } from "@/features/common/components/theme-toggle"
import { StatusUserMenu } from "@/features/auth/components/status-user-menu"
import { publicRoutes } from "@/nav"

/**
 * A minimal dashboard-style shell for the account-status pages. It reuses the
 * app's sidebar/header chrome but exposes NO navigation — only the footer
 * identity chip (with sign-out) — since these users have no active account to
 * browse into.
 */
export function StatusShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <Link
              href={publicRoutes.login}
              aria-label="Rastro"
              className="flex items-center gap-2.5 px-1 py-1.5"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                R
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
                Rastro
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent />

          <SidebarFooter>
            <Suspense
              fallback={
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton size="lg">Account</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              }
            >
              <StatusUserMenu />
            </Suspense>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 !h-5" />
            <span className="text-sm font-medium text-muted-foreground">
              Account Status
            </span>
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
