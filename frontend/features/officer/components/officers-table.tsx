"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlusSignIcon,
  Search01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { Card, CardContent, CardHeader } from "@/components/shadcn/card"
import { Checkbox } from "@/components/shadcn/checkbox"
import { Input } from "@/components/shadcn/input"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcn/empty"
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
import { routes } from "@/nav"
import { AVAILABILITY_META } from "@/lib/utils/officer/display"
import {
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
} from "@/types/officer"

export interface OfficerRow {
  userId: string
  name: string
  email: string
  departmentId: number
  departmentName: string
  availabilityStatus: AvailabilityStatus
  currentWorkload: number
  maxWorkload: number
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

function WorkloadBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {current}/{max}
      </span>
    </div>
  )
}

function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        AVAILABILITY_META[status].badge
      )}
    >
      {AVAILABILITY_META[status].label}
    </span>
  )
}

export function OfficersTable({
  officers,
  departments,
  canManage,
}: {
  officers: OfficerRow[]
  /** Departments to populate the department filter. */
  departments: { id: number; name: string }[]
  canManage: boolean
}) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<AvailabilityStatus | "all">("all")
  const [dept, setDept] = useState<string>("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return officers.filter((o) => {
      const matchesSearch =
        o.name.toLowerCase().includes(query) ||
        o.email.toLowerCase().includes(query) ||
        o.departmentName.toLowerCase().includes(query)
      const matchesStatus = status === "all" || o.availabilityStatus === status
      const matchesDept = dept === "all" || String(o.departmentId) === dept
      return matchesSearch && matchesStatus && matchesDept
    })
  }, [officers, search, status, dept])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)
  const endIndex = Math.min(startIndex + itemsPerPage, filtered.length)

  const hasActiveFilters = Boolean(search) || status !== "all" || dept !== "all"

  const allSelected =
    paginated.length > 0 && paginated.every((o) => selectedIds.includes(o.userId))
  const someSelected =
    !allSelected && paginated.some((o) => selectedIds.includes(o.userId))

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? paginated.map((o) => o.userId) : [])
  }
  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    )
  }

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v)
      setCurrentPage(1)
    }
  }

  const searchInput = (
    <div className="relative w-full max-w-xs">
      <HugeiconsIcon
        icon={Search01Icon}
        size={14}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        value={search}
        onChange={(e) => resetPage(setSearch)(e.target.value)}
        placeholder="Search officers…"
        className="h-8 pl-8 text-sm"
      />
    </div>
  )

  const statusSelect = (
    <Select
      value={status}
      onValueChange={(v) => resetPage(setStatus)(v as AvailabilityStatus | "all")}
    >
      <SelectTrigger size="sm" className="w-36 text-xs">
        <SelectValue placeholder="Availability" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All availability</SelectItem>
        {AVAILABILITY_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {AVAILABILITY_META[s].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const deptSelect = (
    <Select value={dept} onValueChange={(v) => resetPage(setDept)(v)}>
      <SelectTrigger size="sm" className="w-40 text-xs">
        <SelectValue placeholder="Department" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All departments</SelectItem>
        {departments.map((d) => (
          <SelectItem key={d.id} value={String(d.id)}>
            {d.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const emptyState = (
    <Empty>
      <EmptyMedia variant="icon">
        <HugeiconsIcon icon={UserGroupIcon} size={24} />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>No officers found</EmptyTitle>
        <EmptyDescription>
          {hasActiveFilters
            ? "Try adjusting your search or filters."
            : "Get started by onboarding your first officer."}
        </EmptyDescription>
      </EmptyHeader>
      {canManage && !hasActiveFilters && (
        <Button asChild variant="brand">
          <Link href={routes.officers.create}>
            <HugeiconsIcon icon={PlusSignIcon} />
            New officer
          </Link>
        </Button>
      )}
    </Empty>
  )

  return (
    <>
      {/* ── Desktop (md+) ──────────────────────────────────────────── */}
      <Card className="hidden py-0 md:block">
        <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-2">
          {searchInput}
          {deptSelect}
          {statusSelect}
          <div className="ml-auto flex items-center gap-2 border-l pl-3">
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              Rows per page
            </span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(v) => resetPage(setItemsPerPage)(Number(v))}
            >
              <SelectTrigger size="sm" className="w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {paginated.length > 0 ? (
          <>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 pl-5">
                      <Checkbox
                        checked={
                          someSelected ? "indeterminate" : allSelected
                        }
                        onCheckedChange={(c) => toggleAll(Boolean(c))}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Officer</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Workload</TableHead>
                    <TableHead>Availability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((officer) => (
                    <TableRow
                      key={officer.userId}
                      onClick={() =>
                        router.push(routes.officers.detail(officer.userId).href)
                      }
                      className="cursor-pointer"
                    >
                      <TableCell
                        className="pl-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.includes(officer.userId)}
                          onCheckedChange={(c) =>
                            toggleOne(officer.userId, Boolean(c))
                          }
                          aria-label={`Select ${officer.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
                            {initialsOf(officer.name) || "U"}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {officer.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {officer.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {officer.departmentName}
                      </TableCell>
                      <TableCell>
                        <WorkloadBar
                          current={officer.currentWorkload}
                          max={officer.maxWorkload}
                        />
                      </TableCell>
                      <TableCell>
                        <AvailabilityBadge status={officer.availabilityStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <div className="flex items-center justify-between border-t px-4 py-2">
              <span className="text-sm text-muted-foreground">
                {filtered.length === 0 ? 0 : startIndex + 1}–{endIndex} of{" "}
                {filtered.length} officers
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <CardContent className="py-10">{emptyState}</CardContent>
        )}
      </Card>

      {/* ── Mobile (<md) ──────────────────────────────────────────── */}
      <div className="space-y-3 md:hidden">
        <div className="flex flex-wrap gap-2">
          {searchInput}
          {deptSelect}
          {statusSelect}
        </div>

        {paginated.length > 0 ? (
          <>
            <div className="flex flex-col gap-3">
              {paginated.map((officer) => (
                <Link
                  key={officer.userId}
                  href={routes.officers.detail(officer.userId).href}
                >
                  <Card className="transition-shadow hover:shadow-md active:opacity-80">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
                            {initialsOf(officer.name) || "U"}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {officer.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {officer.departmentName}
                            </p>
                          </div>
                        </div>
                        <AvailabilityBadge status={officer.availabilityStatus} />
                      </div>
                      <div className="mt-3">
                        <WorkloadBar
                          current={officer.currentWorkload}
                          max={officer.maxWorkload}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          emptyState
        )}
      </div>

      {/* Selection hint (parity with the reference's bulk-select column) */}
      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} selected
        </p>
      )}
    </>
  )
}
