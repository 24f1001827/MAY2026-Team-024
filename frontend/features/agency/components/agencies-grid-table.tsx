"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Briefcase01Icon,
  Building03Icon,
  LicenseIcon,
  Mail01Icon,
  Search01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card"
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
import { Pagination } from "@/features/common/components/pagination"
import { cn } from "@/lib/utils"
import { routes } from "@/nav"
import type { UserStatus } from "@/types/user"

/** An agency row enriched with the fields shown on its card. */
export type AgencyCard = {
  id: string
  name: string
  email: string
  contactPerson: string
  registrationNumber: string
  currentProjects: number
  maxProjects: number
  status: UserStatus
}

const STATUS_META: Record<UserStatus, { label: string; badge: string }> = {
  Active: {
    label: "Active",
    badge:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300",
  },
  PendingApproval: {
    label: "Pending",
    badge:
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300",
  },
  Rejected: {
    label: "Rejected",
    badge:
      "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-300",
  },
  Blocked: {
    label: "Blocked",
    badge:
      "bg-zinc-100 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-300",
  },
}

// Derived from STATUS_META (which is exhaustive over UserStatus via its
// Record<UserStatus, …> type). A new status must be added to STATUS_META or it
// won't compile, and this filter order picks it up automatically — one source
// of truth, no drift. Object key order follows STATUS_META's declaration order.
const STATUS_ORDER = Object.keys(STATUS_META) as UserStatus[]

interface AgencyFilters {
  search: string
  status: UserStatus | "all"
}

export function AgenciesGridTable({ agencies }: { agencies: AgencyCard[] }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [filters, setFilters] = useState<AgencyFilters>({
    search: "",
    status: "all",
  })

  function handleFilterChange(key: keyof AgencyFilters, value: string): void {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    return agencies.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(query) ||
        a.contactPerson.toLowerCase().includes(query) ||
        a.registrationNumber.toLowerCase().includes(query)
      const matchesStatus =
        filters.status === "all" || a.status === filters.status
      return matchesSearch && matchesStatus
    })
  }, [agencies, filters])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)
  const endIndex = Math.min(startIndex + itemsPerPage, filtered.length)

  return (
    <Card className="py-0">
      {/* Inline filters */}
      <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-2">
        <div className="relative w-full max-w-xs">
          <HugeiconsIcon
            icon={Search01Icon}
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="Search agencies…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(v) => handleFilterChange("status", v)}
        >
          <SelectTrigger size="sm" className="w-40 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2 border-l pl-3">
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            Rows per page
          </span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(v) => {
              setItemsPerPage(Number(v))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger size="sm" className="w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[8, 12, 16, 24].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {paginated.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {paginated.map((agency) => (
              <Link
                key={agency.id}
                href={routes.agencies.detail(agency.id).href}
              >
                <Card className="h-full cursor-pointer text-sm transition-all hover:border-brand/40 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                        <HugeiconsIcon icon={Building03Icon} size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="line-clamp-2 text-sm">
                          {agency.name}
                        </CardTitle>
                        <span
                          className={cn(
                            "mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                            STATUS_META[agency.status].badge
                          )}
                        >
                          {STATUS_META[agency.status].label}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        size={14}
                        className="shrink-0"
                      />
                      <span className="truncate">{agency.email}</span>
                    </p>

                    <div className="flex items-center gap-1.5 text-sm">
                      <HugeiconsIcon
                        icon={UserIcon}
                        size={14}
                        className="shrink-0 text-muted-foreground"
                      />
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="truncate font-medium text-foreground">
                        {agency.contactPerson}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <HugeiconsIcon
                          icon={LicenseIcon}
                          size={14}
                          className="shrink-0"
                        />
                        <span className="truncate">
                          {agency.registrationNumber}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <HugeiconsIcon icon={Briefcase01Icon} size={14} />
                        {agency.currentProjects}/{agency.maxProjects}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Empty>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Building03Icon} size={24} />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No agencies found</EmptyTitle>
              <EmptyDescription>
                {filters.search || filters.status !== "all"
                  ? "Try adjusting your filters to find what you're looking for."
                  : "Agencies appear here once they register and are approved."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>

      {/* Footer: count + pagination */}
      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-sm text-muted-foreground">
          {filtered.length === 0 ? 0 : startIndex + 1}–{endIndex} of{" "}
          {filtered.length} agencies
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </Card>
  )
}
