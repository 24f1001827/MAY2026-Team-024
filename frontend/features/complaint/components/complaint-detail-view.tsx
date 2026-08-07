"use client"

import { notFound } from "next/navigation"

import { ApiError } from "@/lib/api/api-client"
import { ComplaintDetail } from "@/features/complaint/components/complaint-detail"
import { useComplaint } from "@/hooks/complaint"
import { usePublicDepartments } from "@/hooks/department"
import type { UserRole } from "@/types/user"

/**
 * Loads a complaint (with its images + activity timeline) and resolves the
 * department name, then renders the detail view. Citizen name is only known for
 * the viewer's own complaints (the API exposes citizen_id, not the name), so it
 * shows the current user's name when they own it, else a neutral label.
 */
export function ComplaintDetailView({
  id,
  currentRole,
  currentUserId,
  currentUserName,
}: {
  id: string
  currentRole: UserRole
  currentUserId: string
  currentUserName: string
}) {
  const { data, isPending, isError, error } = useComplaint(id)
  const { data: departments } = usePublicDepartments()

  if (isError && error instanceof ApiError && error.isNotFound) notFound()

  if (isPending) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading complaint…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center text-sm text-destructive">
        {error instanceof Error ? error.message : "Couldn’t load this complaint."}
      </div>
    )
  }

  const { complaint, remarks } = data

  const departmentName =
    departments?.find((d) => d.id === complaint.departmentId)?.name ??
    `Department #${complaint.departmentId}`

  const citizenName =
    complaint.citizenId === currentUserId ? currentUserName : "Citizen"

  return (
    <ComplaintDetail
      complaint={complaint}
      citizenName={citizenName}
      departmentName={departmentName}
      currentRole={currentRole}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      initialRemarks={remarks}
    />
  )
}
