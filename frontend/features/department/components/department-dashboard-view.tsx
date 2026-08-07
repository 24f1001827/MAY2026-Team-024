"use client"

import {
  DepartmentDashboard,
  type DepartmentOfficer,
} from "@/features/department/components/department-dashboard"
import {
  useAcceptAssignment,
  useAllotComplaint,
  useDepartmentDashboard,
  useRejectAssignment,
} from "@/hooks/officer"
import { getApiErrorMessage } from "@/lib/api/error-message"
import { toast } from "@/lib/styles/toast-styles"
import type { Complaint } from "@/types/complaint"
import type { UserRole } from "@/types/user"

/**
 * Loads the department dashboard from the API and renders it with real data +
 * live allotment. Used by the officer landing and the admin department detail
 * page. Allotment is gated to the department head (from the payload) or admin;
 * the backend enforces it regardless.
 */
export function DepartmentDashboardView({
  currentRole,
  currentUserId,
}: {
  currentRole: UserRole
  currentUserId: string
}) {
  const { data, isPending, isError, error } = useDepartmentDashboard()
  const allot = useAllotComplaint()
  const accept = useAcceptAssignment()
  const reject = useRejectAssignment()

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

  const isAdmin = currentRole === "Admin"
  const isHead = data.isDepartmentHead

  const officers: DepartmentOfficer[] = data.officers.map((o) => ({
    userId: o.userId,
    name: o.name,
    availabilityStatus: o.availabilityStatus,
    currentWorkload: o.currentWorkload,
    maxWorkload: o.maxWorkload,
    isHead: o.isHead,
  }))

  // Split the department's complaints: unassigned queue vs. the viewer's own.
  const queue: Complaint[] = data.complaints.filter(
    (c) => c.assignedOfficerId === null,
  )
  const myComplaints: Complaint[] = data.complaints.filter(
    (c) => c.assignedOfficerId === currentUserId,
  )

  // Only the head can allot via the officer endpoint; admins manage the record.
  const canAllot = isHead
  const onAllot = canAllot
    ? async (complaintId: string, officerId: string) => {
        await allot.mutateAsync({ complaintId, officerId })
      }
    : undefined

  // Officers act on their own pending assignments from the My Queue tab.
  const isOfficer = currentRole === "Officer"
  const acting = accept.isPending || reject.isPending
  const actingId =
    (accept.isPending && accept.variables) ||
    (reject.isPending && reject.variables) ||
    null

  function handleAccept(complaintId: string) {
    if (acting) return
    accept.mutate(complaintId, {
      onSuccess: () =>
        toast.success("Assignment accepted", {
          description: "The complaint is now under your review.",
        }),
      onError: (err) =>
        toast.error("Couldn’t accept", {
          description: getApiErrorMessage(err, "Please try again."),
        }),
    })
  }

  function handleReject(complaintId: string) {
    if (acting) return
    reject.mutate(complaintId, {
      onSuccess: () =>
        toast.success("Assignment rejected", {
          description: "The complaint has been returned for re-allotment.",
        }),
      onError: (err) =>
        toast.error("Couldn’t reject", {
          description: getApiErrorMessage(err, "Please try again."),
        }),
    })
  }

  return (
    <DepartmentDashboard
      department={data.department}
      officers={officers}
      queue={queue}
      myComplaints={myComplaints}
      totalComplaints={data.complaints.length}
      manualAllotment={data.manualAllotment}
      canManage={isAdmin}
      canAllot={canAllot}
      showMyComplaints={isOfficer}
      onAllot={onAllot}
      allotting={allot.isPending}
      onAccept={isOfficer ? handleAccept : undefined}
      onReject={isOfficer ? handleReject : undefined}
      actingId={actingId}
    />
  )
}
