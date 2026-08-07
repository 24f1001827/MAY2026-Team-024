"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  MoreHorizontalIcon,
  Search01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { Card, CardContent, CardHeader } from "@/components/shadcn/card"
import { Input } from "@/components/shadcn/input"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcn/empty"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table"
import { Pagination } from "@/features/common/components/pagination"
import { useUpdateUserStatus } from "@/hooks/admin-users"
import { toast } from "@/lib/styles/toast-styles"
import { cn } from "@/lib/utils"
import { getRoleMeta, getStatusMeta, ROLE_META } from "@/lib/utils/user/display"
import type { AdminUser } from "@/types/admin-user"
import {
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus,
} from "@/types/user"

const PAGE_SIZE = 8

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/** The status changes offered for a user in a given state. */
function transitionsFor(
  status: UserStatus,
): { label: string; next: UserStatus; destructive?: boolean }[] {
  switch (status) {
    case "PendingApproval":
      return [
        { label: "Approve", next: "Active" },
        { label: "Reject", next: "Rejected", destructive: true },
      ]
    case "Active":
      return [{ label: "Block", next: "Blocked", destructive: true }]
    case "Blocked":
      return [{ label: "Unblock", next: "Active" }]
    case "Rejected":
      return [{ label: "Approve", next: "Active" }]
    default:
      return []
  }
}

function StatusBadge({ status }: { status: UserStatus }) {
  const meta = getStatusMeta(status)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        meta.badge,
      )}
    >
      {meta.label}
    </span>
  )
}

function RoleBadge({ role }: { role: UserRole }) {
  const meta = getRoleMeta(role)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        meta.badge,
      )}
    >
      <HugeiconsIcon icon={meta.icon} className="size-3" />
      {meta.label}
    </span>
  )
}

export function UsersTable({
  users,
  showStatusFilter = true,
}: {
  users: AdminUser[]
  /** Hide the status filter on pages that are already scoped to one status. */
  showStatusFilter?: boolean
}) {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all")
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all")
  const [page, setPage] = useState(1)
  const updateStatus = useUpdateUserStatus()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      if (statusFilter !== "all" && u.status !== statusFilter) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
    })
  }, [users, search, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  function changeStatus(user: AdminUser, next: UserStatus, actionLabel: string) {
    updateStatus.mutate(
      { id: user.id, status: next },
      {
        onSuccess: () =>
          toast.success(`${actionLabel} · ${user.name}`, {
            description: `Status set to ${getStatusMeta(next).label}.`,
          }),
        onError: (err) =>
          toast.error("Couldn't update user", {
            description:
              err instanceof Error ? err.message : "Please try again.",
          }),
      },
    )
  }

  return (
    <Card className="gap-0 overflow-hidden pb-0">
      <CardHeader className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">All users</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "user" : "users"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search name or email"
              className="h-9 w-48 pl-8"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v as UserRole | "all")
              setPage(1)
            }}
          >
            <SelectTrigger className="h-9 w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {USER_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_META[r].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showStatusFilter && (
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as UserStatus | "all")
                setPage(1)
              }}
            >
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {USER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {getStatusMeta(s).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {pageRows.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={UserGroupIcon} />
              </EmptyMedia>
              <EmptyTitle>No users found</EmptyTitle>
              <EmptyDescription>
                Try a different search or role filter.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0 text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((user) => {
                const transitions = transitionsFor(user.status)
                const busy =
                  updateStatus.isPending &&
                  updateStatus.variables?.id === user.id
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                          {initialsOf(user.name)}
                        </span>
                        <span className="font-medium text-foreground">
                          {user.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">{user.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {transitions.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={busy}
                              aria-label={`Manage ${user.name}`}
                            >
                              <HugeiconsIcon icon={MoreHorizontalIcon} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {transitions.map((t) => (
                              <DropdownMenuItem
                                key={t.next}
                                className={cn(
                                  t.destructive &&
                                    "text-destructive focus:bg-destructive/10 focus:text-destructive",
                                )}
                                onSelect={() =>
                                  changeStatus(user, t.next, t.label)
                                }
                              >
                                {t.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {totalPages > 1 && (
        <div className="flex justify-end border-t border-border p-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </Card>
  )
}
