"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { officerService } from "@/services/officer-service"
import { complaintKeys } from "@/hooks/complaint/keys"
import type { CreateReviewReportInput } from "@/types/officer"

/** Submit the review report for a complaint, then refresh its detail. */
export function useSubmitReviewReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      complaintId,
      input,
    }: {
      complaintId: string
      input: CreateReviewReportInput
    }) => officerService.submitReviewReport(complaintId, input),
    onSuccess: (_data, { complaintId }) =>
      qc.invalidateQueries({ queryKey: complaintKeys.detail(complaintId) }),
  })
}

/** Request budget for a complaint, then refresh its detail. */
export function useRequestBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (complaintId: string) =>
      officerService.requestBudget(complaintId),
    onSuccess: (_data, complaintId) =>
      qc.invalidateQueries({ queryKey: complaintKeys.detail(complaintId) }),
  })
}
