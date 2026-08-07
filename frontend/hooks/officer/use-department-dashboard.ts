"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { officerService } from "@/services/officer-service"
import { officerKeys } from "./keys"

/** The logged-in officer's department dashboard. */
export function useDepartmentDashboard() {
  return useQuery({
    queryKey: officerKeys.departmentDashboard(),
    queryFn: () => officerService.getDepartmentDashboard(),
  })
}

/** Head-only: allot a complaint, then refresh the dashboard. */
export function useAllotComplaint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      complaintId,
      officerId,
      assignmentNote,
    }: {
      complaintId: string
      officerId: string
      assignmentNote?: string
    }) =>
      officerService.allotComplaint(complaintId, officerId, assignmentNote),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: officerKeys.departmentDashboard() }),
  })
}

/** The assigned officer accepts their pending assignment. */
export function useAcceptAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (complaintId: string) =>
      officerService.acceptAssignment(complaintId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: officerKeys.departmentDashboard() }),
  })
}

/** The assigned officer rejects their pending assignment. */
export function useRejectAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (complaintId: string) =>
      officerService.rejectAssignment(complaintId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: officerKeys.departmentDashboard() }),
  })
}
