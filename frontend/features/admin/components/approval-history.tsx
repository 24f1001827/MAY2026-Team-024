"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkBadge01Icon, Search01Icon } from "@hugeicons/core-free-icons"

import { Card, CardContent, CardHeader } from "@/components/shadcn/card"
import { Input } from "@/components/shadcn/input"
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
import { cn } from "@/lib/utils"
import { createResetPage } from "@/lib/utils/common/pagination"
import { getRoleMeta, getStatusMeta } from "@/lib/utils/user/display"
import type { AdminUser } from "@/types/admin-user"
import { USER_STATUSES, type UserStatus } from "@/types/user"

/** Only officers and agencies go through the approval workflow. */
const APPROVAL_ROLES = ["Officer", "Agency"] as const
type ApprovalRole = (typeof APPROVAL_ROLES)[number]

const PAGE_SIZE = 8

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

export function ApprovalHistory({ users }: { users: AdminUser[] }) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all")
  const [roleFilter, setRoleFilter] = useState<ApprovalRole | "all">("all")
  const [page, setPage] = useState(1)

  // Any filter change returns to the first page.
  const resetPage = createResetPage(setPage)

  // Officer + agency registration requests. (React Compiler memoizes.)
  const requests = users.filter((u) =>
    APPROVAL_ROLES.includes(u.role as ApprovalRole),
  )

  // Filtered rows for the table.
  const query = search.trim().toLowerCase()
  const filtered = requests.filter((u) => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false
    if (roleFilter !== "all" && u.role !== roleFilter) return false
    if (!query) return true
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <Card className="gap-0 overflow-hidden pb-0">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border pb-4">
        <HugeiconsIcon
          icon={CheckmarkBadge01Icon}
          className="size-4 text-muted-foreground"
        />
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Approval history
          </h2>
          <p className="text-xs text-muted-foreground">
            Officer and agency registration requests
          </p>
        </div>
      </CardHeader>

      {/* Search + filters */}
      <div className="flex flex-col gap-2 border-t border-border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => resetPage(setSearch)(e.target.value)}
            placeholder="Search name or email"
            className="h-9 w-full pl-8 sm:w-56"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={roleFilter}
            onValueChange={resetPage(
              (v: string) => setRoleFilter(v as ApprovalRole | "all"),
            )}
          >
            <SelectTrigger className="h-9 w-32">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {APPROVAL_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {getRoleMeta(r).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={resetPage(
              (v: string) => setStatusFilter(v as UserStatus | "all"),
            )}
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
        </div>
      </div>

      <CardContent className="border-t border-border p-0">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {requests.length === 0
              ? "No approval requests yet."
              : "No requests match your filters."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-foreground">
                    {u.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getRoleMeta(u.role).label}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-right">
                    <StatusBadge status={u.status} />
                  </TableCell>
                </TableRow>
              ))}
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
