"use client"

import { useQuery } from "@tanstack/react-query"

import { complaintService } from "@/services/complaint-service"
import { complaintKeys } from "./keys"

/** The signed-in citizen's own complaints. */
export function useMyComplaints() {
  return useQuery({
    queryKey: complaintKeys.mine(),
    queryFn: () => complaintService.listMine(),
  })
}

/** Admin: all complaints. */
export function useAllComplaints() {
  return useQuery({
    queryKey: complaintKeys.adminList(),
    queryFn: () => complaintService.listAll(),
  })
}

/** A single complaint with its images (detail view). */
export function useComplaint(id: string) {
  return useQuery({
    queryKey: complaintKeys.detail(id),
    queryFn: () => complaintService.getById(id),
    enabled: Boolean(id),
  })
}

/** Admin: the officer's review report for a complaint (null if none). */
export function useReviewReport(id: string | null) {
  return useQuery({
    queryKey: [...complaintKeys.detail(id ?? ""), "review-report"],
    queryFn: () => complaintService.getReviewReport(id as string),
    enabled: Boolean(id),
  })
}
