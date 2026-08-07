"use client"

import { notFound } from "next/navigation"

import { ApiError } from "@/lib/api/api-client"
import {
  DepartmentDashboard,
  type DepartmentOfficer,
} from "@/features/department/components/department-dashboard"
import {
  useAdminAllotComplaint,
  useDepartmentDashboard,
} from "@/hooks/department"
import type { Complaint } from "@/types/complaint"

/**
 * Admin per-department dashboard: loads a specific department's dashboard by id
 * and renders it with live allotment via the admin assign endpoint. Admins can
 * allot and manage the record.
 */
export function AdminDepartmentDashboardView({ id }: { id: number }) {
  const { data, isPending, isError, error } = useDepartmentDashboard(id)
  const allot = useAdminAllotComplaint(id)

  if (isError && error instanceof ApiError && error.isNotFound) notFound()

  if (isPending) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading department…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center text-sm text-destructive">
        {error instanceof Error ? error.message : "Couldn’t load the department."}
      </div>
    )
  }

  const officers: DepartmentOfficer[] = data.officers.map((o) => ({
    userId: o.userId,
    name: o.name,
    availabilityStatus: o.availabilityStatus,
    currentWorkload: o.currentWorkload,
    maxWorkload: o.maxWorkload,
    isHead: o.isHead,
  }))

  const queue: Complaint[] = data.complaints.filter(
    (c) => c.assignedOfficerId === null,
  )

  return (
    <DepartmentDashboard
      department={data.department}
      officers={officers}
      queue={queue}
      myComplaints={[]}
      totalComplaints={data.complaints.length}
      manualAllotment={data.manualAllotment}
      canManage
      canAllot
      showMyComplaints={false}
      onAllot={async (complaintId, officerId) => {
        await allot.mutateAsync({ complaintId, officerId })
      }}
      allotting={allot.isPending}
    />
  )
}
