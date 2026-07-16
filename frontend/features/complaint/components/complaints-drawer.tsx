"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Location01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { Input } from "@/components/shadcn/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu"
import { cn } from "@/lib/utils"
import { routes } from "@/nav"
import {
  PHASE_META,
  PHASE_ORDER,
  PRIORITY_META,
  PRIORITY_ORDER,
  formatShortDate,
  statusBadgeClass,
  statusLabel,
  type ComplaintPhase,
} from "@/lib/utils/complaint/display"
import type { ComplaintPriority } from "@/types/complaint"
import type { Department } from "@/types/department"
import type { ComplaintMapItem } from "../../dashboard/components/types"

export type ComplaintFilters = {
  search: string
  priority: ComplaintPriority | "all"
  phase: ComplaintPhase | "all"
  departmentId: number | "all"
}

type ComplaintsDrawerProps = {
  complaints: ComplaintMapItem[]
  totalCount: number
  departments: Pick<Department, "id" | "name">[]
  filters: ComplaintFilters
  onFiltersChange: (next: ComplaintFilters) => void
  selectedId: string | null
  onSelect: (id: string) => void
  onClose: () => void
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-brand bg-brand/10 text-brand"
          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

export function ComplaintsDrawer({
  complaints,
  totalCount,
  departments,
  filters,
  onFiltersChange,
  selectedId,
  onSelect,
  onClose,
}: ComplaintsDrawerProps) {
  const set = (patch: Partial<ComplaintFilters>) =>
    onFiltersChange({ ...filters, ...patch })

  const activeDept =
    filters.departmentId === "all"
      ? "All departments"
      : (departments.find((d) => d.id === filters.departmentId)?.name ??
        "All departments")

  const hasActiveFilters =
    filters.search !== "" ||
    filters.priority !== "all" ||
    filters.phase !== "all" ||
    filters.departmentId !== "all"

  return (
    <div className="flex h-full w-full flex-col bg-transparent">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Complaints</h2>
            <p className="text-xs text-muted-foreground">
              {complaints.length} of {totalCount} shown
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close list"
            onClick={onClose}
          >
            <HugeiconsIcon icon={Cancel01Icon} />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search by title, area, or city…"
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip
              active={filters.phase === "all"}
              onClick={() => set({ phase: "all" })}
            >
              All status
            </Chip>
            {PHASE_ORDER.map((phase) => (
              <Chip
                key={phase}
                active={filters.phase === phase}
                onClick={() => set({ phase })}
              >
                {PHASE_META[phase].label}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Chip
              active={filters.priority === "all"}
              onClick={() => set({ priority: "all" })}
            >
              Any priority
            </Chip>
            {PRIORITY_ORDER.map((priority) => (
              <Chip
                key={priority}
                active={filters.priority === priority}
                onClick={() => set({ priority })}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      PRIORITY_META[priority].dot
                    )}
                  />
                  {PRIORITY_META[priority].label}
                </span>
              </Chip>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-between gap-2 font-normal"
                >
                  <span className="truncate">{activeDept}</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-48">
                <DropdownMenuItem onSelect={() => set({ departmentId: "all" })}>
                  All departments
                </DropdownMenuItem>
                {departments.map((dept) => (
                  <DropdownMenuItem
                    key={dept.id}
                    onSelect={() => set({ departmentId: dept.id })}
                  >
                    {dept.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onFiltersChange({
                    search: "",
                    priority: "all",
                    phase: "all",
                    departmentId: "all",
                  })
                }
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {complaints.length === 0 ? (
          <div className="grid h-full place-items-center px-6 text-center">
            <div>
              <p className="text-sm font-medium text-foreground">
                No matching complaints
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filters.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {complaints.map((complaint) => {
              const selected = complaint.id === selectedId
              return (
                <li key={complaint.id}>
                  <div
                    className={cn(
                      "overflow-hidden rounded-xl border transition-colors",
                      selected
                        ? "border-brand bg-brand/5 ring-1 ring-brand/30"
                        : "border-border bg-card"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(complaint.id)}
                      className="block w-full p-3 text-left transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                            statusBadgeClass(complaint.status)
                          )}
                        >
                          {statusLabel(complaint.status)}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatShortDate(complaint.createdAt)}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-1 text-sm font-semibold text-foreground">
                        {complaint.title}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <HugeiconsIcon
                          icon={Location01Icon}
                          size={13}
                          className="shrink-0"
                        />
                        <span className="line-clamp-1">
                          {complaint.locality}, {complaint.city}
                        </span>
                      </p>

                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              PRIORITY_META[complaint.priority].dot
                            )}
                          />
                          {PRIORITY_META[complaint.priority].label}
                        </span>
                        <span className="truncate">
                          {complaint.departmentName}
                        </span>
                      </div>
                    </button>

                    <Link
                      href={routes.complaints.detail(complaint.id).href}
                      className="flex items-center justify-between border-t border-border px-3 py-2 text-xs font-medium text-brand transition-colors hover:bg-accent"
                    >
                      View details
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
