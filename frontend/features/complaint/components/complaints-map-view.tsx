"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Menu01Icon, PlusSignIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/shadcn/drawer"
import { routes } from "@/nav"
import { statusPhase } from "@/lib/utils/complaint/display"
import { mockComplaints, mockDepartments } from "@/components/shared/mock-data"
import { ComplaintsMap } from "./complaints-map"
import { ComplaintsDrawer, type ComplaintFilters } from "./complaints-drawer"
import type { ComplaintMapItem } from "../../dashboard/components/types"

const INITIAL_FILTERS: ComplaintFilters = {
  search: "",
  priority: "all",
  phase: "all",
  departmentId: "all",
}

export function ComplaintsMapView({
  canCreate = false,
}: {
  canCreate?: boolean
}) {
  const { resolvedTheme } = useTheme()
  const [filters, setFilters] = useState<ComplaintFilters>(INITIAL_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Enrich complaints with their department name once.
  const complaints = useMemo<ComplaintMapItem[]>(() => {
    const deptName = new Map(mockDepartments.map((d) => [d.id, d.name]))
    return mockComplaints.map((c) => ({
      ...c,
      departmentName: deptName.get(c.departmentId) ?? "Unassigned",
    }))
  }, [])

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    return complaints.filter((c) => {
      if (filters.priority !== "all" && c.priority !== filters.priority) {
        return false
      }
      if (filters.phase !== "all" && statusPhase(c.status) !== filters.phase) {
        return false
      }
      if (
        filters.departmentId !== "all" &&
        c.departmentId !== filters.departmentId
      ) {
        return false
      }
      if (query) {
        const haystack =
          `${c.title} ${c.address} ${c.locality} ${c.city} ${c.departmentName}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
  }, [complaints, filters])

  // Keep the selection valid as filters change.
  const visibleSelectedId =
    selectedId && filtered.some((c) => c.id === selectedId) ? selectedId : null

  // Selecting from the list pans the map and reveals it (closes the drawer).
  function handleSelectFromList(id: string) {
    setSelectedId(id)
    setDrawerOpen(false)
  }

  return (
    <div className="relative size-full overflow-hidden">
      <ComplaintsMap
        complaints={filtered}
        selectedId={visibleSelectedId}
        onSelect={setSelectedId}
        colorScheme={resolvedTheme === "dark" ? "DARK" : "LIGHT"}
      />

      {/* File-a-complaint entry point — only citizens and admins can create. */}
      {canCreate && (
        <Button
          asChild
          variant="brand"
          className="absolute left-4 top-4 z-10 shadow-lg"
        >
          <Link href={routes.complaints.new}>
            <HugeiconsIcon icon={PlusSignIcon} />
            File a complaint
          </Link>
        </Button>
      )}

      <Drawer
        direction="right"
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      >
        <DrawerTrigger asChild>
          <Button className="absolute right-4 top-4 z-10 shadow-lg">
            <HugeiconsIcon icon={Menu01Icon} />
            Complaints
            <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 text-xs">
              {filtered.length}
            </span>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="sm:max-w-md">
          <DrawerTitle className="sr-only">Complaints</DrawerTitle>
          <DrawerDescription className="sr-only">
            Search and filter civic complaints, and locate them on the map.
          </DrawerDescription>
          <ComplaintsDrawer
            complaints={filtered}
            totalCount={complaints.length}
            departments={mockDepartments}
            filters={filters}
            onFiltersChange={setFilters}
            selectedId={visibleSelectedId}
            onSelect={handleSelectFromList}
            onClose={() => setDrawerOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </div>
  )
}
