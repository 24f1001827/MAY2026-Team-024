"use client"

import { useQuery } from "@tanstack/react-query"

import { ComplaintsMapView } from "@/features/complaint/components/complaints-map-view"
import { complaintKeys } from "@/hooks/complaint"
import { useDepartmentDashboard } from "@/hooks/officer"
import { usePublicDepartments } from "@/hooks/department"
import { complaintService } from "@/services/complaint-service"
import { enrichComplaints } from "@/lib/utils/complaint/public-complaints"
import type { UserRole } from "@/types/user"

/** Centered status message inside the full-bleed map area. */
function MapStatus({
  children,
  tone = "muted",
}: {
  children: React.ReactNode
  tone?: "muted" | "destructive"
}) {
  return (
    <div
      className={
        "grid h-full place-items-center text-sm " +
        (tone === "destructive" ? "text-destructive" : "text-muted-foreground")
      }
    >
      {children}
    </div>
  )
}

/**
 * Officer map: the complaints in the officer's department currently allotted to
 * them (from the department dashboard endpoint, filtered by assignee). All of
 * an officer's complaints are in their own department, so its name is used for
 * enrichment.
 */
function OfficerComplaintsMap({ currentUserId }: { currentUserId: string }) {
  const { data, isPending, isError, error } = useDepartmentDashboard()

  if (isPending) return <MapStatus>Loading complaints…</MapStatus>
  if (isError) {
    return (
      <MapStatus tone="destructive">
        {error instanceof Error ? error.message : "Couldn’t load complaints."}
      </MapStatus>
    )
  }

  const mine = data.complaints.filter(
    (c) => c.assignedOfficerId === currentUserId,
  )
  const deptOptions = [{ id: data.department.id, name: data.department.name }]
  const enriched = enrichComplaints(mine, deptOptions)

  return (
    <ComplaintsMapView
      complaints={enriched}
      departments={deptOptions}
      canCreate={false}
    />
  )
}

/**
 * Loads the complaints visible to the current role and renders the map:
 *   - Citizen → their own (`/complaints/my`), may file new ones.
 *   - Admin   → all (`/admin/complaints`), read-only oversight.
 *   - Officer → those allotted to them (from the department dashboard).
 *   - Agency  → none yet (separate module) — empty map.
 */
export function ComplaintsView({
  role,
  currentUserId,
  canCreate,
}: {
  role: UserRole
  currentUserId: string
  canCreate: boolean
}) {
  const isAdmin = role === "Admin"
  const isCitizen = role === "Citizen"

  const { data: complaints, isPending, isError, error } = useQuery({
    queryKey: isAdmin ? complaintKeys.adminList() : complaintKeys.mine(),
    queryFn: () =>
      isAdmin ? complaintService.listAll() : complaintService.listMine(),
    enabled: isAdmin || isCitizen,
  })

  const { data: departments } = usePublicDepartments()

  // Officers see their own allotted complaints (different data source).
  if (role === "Officer") {
    return <OfficerComplaintsMap currentUserId={currentUserId} />
  }

  // Agency: no in-scope list endpoint — render an empty map.
  if (!isAdmin && !isCitizen) {
    return (
      <ComplaintsMapView complaints={[]} departments={[]} canCreate={canCreate} />
    )
  }

  if (isPending) return <MapStatus>Loading complaints…</MapStatus>
  if (isError) {
    return (
      <MapStatus tone="destructive">
        {error instanceof Error ? error.message : "Couldn’t load complaints."}
      </MapStatus>
    )
  }

  const deptOptions = departments ?? []
  const enriched = enrichComplaints(complaints, deptOptions)

  return (
    <ComplaintsMapView
      complaints={enriched}
      departments={deptOptions}
      canCreate={canCreate}
    />
  )
}
