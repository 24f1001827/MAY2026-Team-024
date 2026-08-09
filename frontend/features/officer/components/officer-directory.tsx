"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, UserGroupIcon } from "@hugeicons/core-free-icons"

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
import { OfficerStatsCard } from "@/features/officer/components/officer-stats-card"
import { Pagination } from "@/features/common/components/pagination"
import { useOfficerDirectory } from "@/hooks/officer"
import { AVAILABILITY_META } from "@/lib/utils/officer/display"
import { cn } from "@/lib/utils"
import { createResetPage } from "@/lib/utils/common/pagination"
import {
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
} from "@/types/officer"

const PAGE_SIZE = 10

function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const meta = AVAILABILITY_META[status]
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

/**
 * Read-only officer directory for any authenticated user: name, department, and
 * availability, with search + department + availability filters. Privacy-safe —
 * no contact info or workload (the backend only serves those fields).
 */
export function OfficerDirectory() {
  const { data, isPending, isError, error, refetch } = useOfficerDirectory()

  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState("all")
  const [availability, setAvailability] = useState("all")
  const [page, setPage] = useState(1)

  const officers = useMemo(() => data ?? [], [data])

  const departments = useMemo(
    () => Array.from(new Set(officers.map((o) => o.department))).sort(),
    [officers],
  )

  const counts = useMemo(
    () => ({
      total: officers.length,
      available: officers.filter((o) => o.availabilityStatus === "Available")
        .length,
      engaged: officers.filter((o) => o.availabilityStatus === "Engaged")
        .length,
      onLeave: officers.filter((o) => o.availabilityStatus === "OnLeave")
        .length,
    }),
    [officers],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return officers.filter((o) => {
      if (department !== "all" && o.department !== department) return false
      if (availability !== "all" && o.availabilityStatus !== availability)
        return false
      return o.name.toLowerCase().includes(q)
    })
  }, [officers, search, department, availability])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, filtered.length)
  const rows = filtered.slice(startIndex, endIndex)

  // Any filter change returns to the first page.
  const resetPage = createResetPage(setPage)

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
        <p className="text-sm font-medium text-destructive">
          Couldn’t load officers.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {error instanceof Error ? error.message : "Please try again."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-xs font-medium text-brand underline-offset-2 hover:underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <OfficerStatsCard
        total={counts.total}
        available={counts.available}
        engaged={counts.engaged}
        onLeave={counts.onLeave}
      />

      <Card className="gap-0 overflow-hidden pb-0">
        <CardHeader className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
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
          <div className="flex items-center gap-2">
            <Select value={department} onValueChange={resetPage(setDepartment)}>
              <SelectTrigger size="sm" className="w-40 text-xs">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={availability}
              onValueChange={resetPage(setAvailability)}
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
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isPending ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              Loading officers…
            </p>
          ) : rows.length === 0 ? (
            <Empty className="py-12">
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={UserGroupIcon} size={24} />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No officers found</EmptyTitle>
                <EmptyDescription>
                  {officers.length === 0
                    ? "No officers are listed yet."
                    : "Try adjusting your search or filters."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Officer</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.userId}>
                    <TableCell className="pl-5 font-medium text-foreground">
                      {o.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {o.department}
                    </TableCell>
                    <TableCell>
                      <AvailabilityBadge status={o.availabilityStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {startIndex + 1}–{endIndex} of {filtered.length}{" "}
              {filtered.length === 1 ? "officer" : "officers"}
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
