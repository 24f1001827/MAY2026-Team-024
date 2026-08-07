"use client"

import { useQuery } from "@tanstack/react-query"

import { ComplaintsMapView } from "@/features/complaint/components/complaints-map-view"
import { complaintKeys } from "@/hooks/complaint"
import { usePublicDepartments } from "@/hooks/department"
import { complaintService } from "@/services/complaint-service"
import { enrichComplaints } from "@/lib/utils/complaint/public-complaints"
import type { UserRole } from "@/types/user"

/**
 * Loads the complaints visible to the current role and renders the map:
 *   - Citizen → their own (`/complaints/my`)
 *   - Admin   → all (`/admin/complaints`)
 *   - Officer/Agency → none yet (those complaint views are a separate module,
 *     not integrated) — shows an empty map.
 * Department names are resolved from the public departments list.
 */
export function ComplaintsView({
  role,
  canCreate,
}: {
  role: UserRole
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

  // Officer/Agency: no in-scope list endpoint — render an empty map.
  if (!isAdmin && !isCitizen) {
    return (
      <ComplaintsMapView complaints={[]} departments={[]} canCreate={canCreate} />
    )
  }

  if (isPending) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted-foreground">
        Loading complaints…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="grid h-full place-items-center text-sm text-destructive">
        {error instanceof Error ? error.message : "Couldn’t load complaints."}
      </div>
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
