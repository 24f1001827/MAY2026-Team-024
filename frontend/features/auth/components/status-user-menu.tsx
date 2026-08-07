"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Logout01Icon } from "@hugeicons/core-free-icons"

import { Avatar, AvatarFallback } from "@/components/shadcn/avatar"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/shadcn/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu"
import { useLogout } from "@/hooks/auth"
import { publicRoutes } from "@/nav"

const STATUS_LABEL: Record<string, string> = {
  [publicRoutes.accountStatus.pending]: "Pending approval",
  [publicRoutes.accountStatus.rejected]: "Rejected",
  [publicRoutes.accountStatus.blocked]: "Blocked",
}

function initialsOf(email: string): string {
  const local = email.split("@")[0] ?? ""
  return local.slice(0, 2).toUpperCase() || "U"
}

/**
 * Footer identity chip for the status shell — mirrors the dashboard sidebar's
 * user dropdown, but the identity is the email typed at login (these users have
 * no active session) and the sub-line is their account status.
 */
export function StatusUserMenu() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const logout = useLogout()

  const email = params.get("email") ?? ""
  const displayName = email || "Your account"
  const statusLabel = STATUS_LABEL[pathname] ?? "Account"

  function handleSignOut() {
    logout.mutate(undefined, {
      onSettled: () => {
        router.push(publicRoutes.login)
        router.refresh()
      },
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={displayName}
              className="data-[state=open]:bg-sidebar-accent"
            >
              <Avatar className="size-8 shrink-0 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                  {initialsOf(email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold text-foreground">
                  {displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {statusLabel}
                </span>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="ml-auto size-4 opacity-60 group-data-[collapsible=icon]:hidden"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            sideOffset={8}
            className="min-w-56"
          >
            <DropdownMenuLabel className="font-normal normal-case tracking-normal">
              <div className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-foreground">
                  {displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {statusLabel}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <HugeiconsIcon icon={Logout01Icon} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
