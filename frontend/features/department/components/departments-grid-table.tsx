"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  OfficeIcon,
  PlusSignIcon,
  Search01Icon,
  UserStar01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card"
import { Button } from "@/components/shadcn/button"
import { Badge } from "@/components/shadcn/badge"
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
import { formatCurrency } from "@/lib/utils/common/format"
import type { DepartmentBudgetSummary } from "@/types/department"
import { routes } from "@/nav"

/** A department row as shown on its card. */
export type DepartmentCard = {
  id: number
  name: string
  description: string
  budget: DepartmentBudgetSummary | null
  headOfficerName: string | null
}

type HeadFilter = "all" | "assigned" | "unassigned"

interface DepartmentFilters {
  search: string
  head: HeadFilter
}

export function DepartmentsGridTable({
  departments,
  canManage,
}: {
  departments: DepartmentCard[]
  canManage: boolean
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [filters, setFilters] = useState<DepartmentFilters>({
    search: "",
    head: "all",
  })

  function handleFilterChange(
    key: keyof DepartmentFilters,
    value: string
  ): void {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    return departments.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query)
      const matchesHead =
        filters.head === "all" ||
        (filters.head === "assigned" && d.headOfficerName !== null) ||
        (filters.head === "unassigned" && d.headOfficerName === null)
      return matchesSearch && matchesHead
    })
  }, [departments, filters])

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
            placeholder="Search departments…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select
          value={filters.head}
          onValueChange={(v) => handleFilterChange("head", v)}
        >
          <SelectTrigger size="sm" className="w-40 text-xs">
            <SelectValue placeholder="Head officer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            <SelectItem value="assigned">Head Assigned</SelectItem>
            <SelectItem value="unassigned">No Head</SelectItem>
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
            {paginated.map((department) => (
              <Link
                key={department.id}
                href={routes.departments.detail(department.id).href}
              >
                <Card className="h-full cursor-pointer text-sm transition-all hover:border-brand/40 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                        <HugeiconsIcon icon={OfficeIcon} size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="line-clamp-2 text-sm">
                          {department.name}
                        </CardTitle>
                        <Badge variant="outline" className="mt-1 gap-1 text-xs">
                          <HugeiconsIcon icon={Wallet01Icon} size={12} />
                          {department.budget
                            ? formatCurrency(department.budget.total)
                            : "No budget"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {department.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-sm">
                      <HugeiconsIcon
                        icon={UserStar01Icon}
                        size={14}
                        className="shrink-0 text-muted-foreground"
                      />
                      <span className="text-muted-foreground">Head:</span>
                      <span className="truncate font-medium text-foreground">
                        {department.headOfficerName ?? "Not Assigned"}
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
              <HugeiconsIcon icon={OfficeIcon} size={24} />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No departments found</EmptyTitle>
              <EmptyDescription>
                {filters.search || filters.head !== "all"
                  ? "Try adjusting your filters to find what you're looking for."
                  : "Get started by creating your first department."}
              </EmptyDescription>
            </EmptyHeader>
            {canManage && !filters.search && filters.head === "all" && (
              <Button asChild variant="brand">
                <Link href={routes.departments.create}>
                  <HugeiconsIcon icon={PlusSignIcon} />
                  New department
                </Link>
              </Button>
            )}
          </Empty>
        )}
      </CardContent>

      {/* Footer: count + pagination */}
      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-sm text-muted-foreground">
          {filtered.length === 0 ? 0 : startIndex + 1}–{endIndex} of{" "}
          {filtered.length} departments
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
