"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Logout01Icon } from "@hugeicons/core-free-icons"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/shadcn/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/shadcn/collapsible"
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu"
import { useLogout } from "@/hooks/auth"
import { toast } from "@/lib/styles/toast-styles"
import {
  filterNavByAccess,
  getSidebarItems,
  isPathActive,
  publicRoutes,
  routes,
  type NavItem,
  type Role,
} from "@/nav"

type SidebarUser = { name: string; email: string; role: string }

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/** Depth-first list of every sidebar item path (parents + children). */
function collectPaths(items: NavItem[]): string[] {
  return items.flatMap((item) => [item.path, ...collectPaths(item.children)])
}

export function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useLogout()

  // Nav access roles are lower-cased; the mock user role is title-cased.
  const role = user.role.toLowerCase() as Role
  const navItems = useMemo(
    () =>
      filterNavByAccess(getSidebarItems(), {
        role,
        isAuthenticated: true,
      }),
    [role]
  )

  // The active item is the deepest (longest path) item matching the URL, so
  // "/dashboard" doesn't stay highlighted while on "/dashboard/complaints".
  const activePath = useMemo(() => {
    return collectPaths(navItems)
      .filter((path) => isPathActive(path, pathname))
      .sort((a, b) => b.length - a.length)[0]
  }, [navItems, pathname])

  function handleSignOut() {
    logout.mutate(undefined, {
      onSettled: () => {
        toast.success("Signed out", {
          description: "You have been signed out of Rastro.",
        })
        router.push(publicRoutes.login)
        router.refresh()
      },
    })
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href={routes.href}
          aria-label="Rastro home"
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

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const children = item.children
                const hasChildren = children.length > 0

                // Leaf item — plain link.
                if (!hasChildren) {
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.path === activePath}
                        tooltip={item.label}
                      >
                        <Link href={item.path}>
                          {item.icon && <HugeiconsIcon icon={item.icon} />}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                // Parent with children — collapsible group.
                const childActive = children.some(
                  (child) => child.path === activePath
                )
                return (
                  <Collapsible
                    key={item.id}
                    defaultOpen={childActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={item.path === activePath}
                        >
                          {item.icon && <HugeiconsIcon icon={item.icon} />}
                          <span>{item.label}</span>
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                          />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {children.map((child) => (
                            <SidebarMenuSubItem key={child.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={child.path === activePath}
                              >
                                <Link href={child.path}>
                                  {child.icon && (
                                    <HugeiconsIcon icon={child.icon} />
                                  )}
                                  <span>{child.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={user.name}
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="size-8 shrink-0 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                      {initialsOf(user.name) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {user.name}
                    </span>
                    <span className="truncate text-xs capitalize text-muted-foreground">
                      {user.role}
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
                      {user.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
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
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
