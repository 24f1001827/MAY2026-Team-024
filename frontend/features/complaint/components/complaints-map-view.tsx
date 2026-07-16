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
import { publicRoutes, routes } from "@/nav"
import { statusPhase } from "@/lib/utils/complaint/display"
import { ComplaintsMap } from "./complaints-map"
import { ComplaintsDrawer, type ComplaintFilters } from "./complaints-drawer"
import type { ComplaintMapItem } from "../../dashboard/components/types"
import type { Department } from "@/types/department"

const INITIAL_FILTERS: ComplaintFilters = {
  search: "",
  priority: "all",
  phase: "all",
  departmentId: "all",
}

export function ComplaintsMapView({
  complaints,
  departments,
  canCreate = false,
  isPublic = false,
}: {
  /** Enrich complaints upstream (server) so this stays a thin, reusable view. */
  complaints: ComplaintMapItem[]
  departments: Pick<Department, "id" | "name">[]
  canCreate?: boolean
  /** Public map: "View details" points at the public read-only detail route. */
  isPublic?: boolean
}) {
  const { resolvedTheme } = useTheme()
  const [filters, setFilters] = useState<ComplaintFilters>(INITIAL_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Detail link differs by surface: authed dashboard vs public read-only page.
  const detailHref = (id: string) =>
    isPublic
      ? publicRoutes.complaintDetail(id)
      : routes.complaints.detail(id).href

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
        detailHref={detailHref}
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
            departments={departments}
            filters={filters}
            onFiltersChange={setFilters}
            selectedId={visibleSelectedId}
            onSelect={handleSelectFromList}
            onClose={() => setDrawerOpen(false)}
            detailHref={detailHref}
          />
        </DrawerContent>
      </Drawer>
    </div>
  )
}
