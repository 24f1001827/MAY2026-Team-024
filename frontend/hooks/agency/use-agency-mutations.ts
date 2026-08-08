"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { agencyService } from "@/services/agency-service"
import type { WorkOrderStatus } from "@/types/agency"
import { agencyKeys } from "./keys"

/**
 * Submit a proposal for a tender. On success the tender leaves the "open" pool
 * (or its state changes) and a new proposal appears, so refresh both lists.
 */
export function useSubmitProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      tenderId,
      proposalAmount,
      remarks,
      document,
    }: {
      tenderId: number
      proposalAmount: number
      remarks?: string
      document: File
    }) =>
      agencyService.submitProposal(tenderId, {
        proposalAmount,
        remarks,
        document,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agencyKeys.proposals() })
      qc.invalidateQueries({ queryKey: agencyKeys.openTenders() })
    },
  })
}

/**
 * Update a work order's status. The response is a partial work order, so
 * invalidate the detail + list rather than writing the response into the cache.
 */
export function useUpdateWorkOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      workOrderId,
      status,
      completionProof,
    }: {
      workOrderId: number
      status: WorkOrderStatus
      completionProof?: File
    }) =>
      agencyService.updateWorkOrderStatus(workOrderId, {
        status,
        completionProof,
      }),
    onSuccess: (_data, { workOrderId }) => {
      qc.invalidateQueries({ queryKey: agencyKeys.workOrder(workOrderId) })
      qc.invalidateQueries({ queryKey: agencyKeys.workOrders() })
    },
  })
}
