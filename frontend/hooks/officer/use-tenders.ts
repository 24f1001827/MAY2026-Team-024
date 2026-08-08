"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { officerService } from "@/services/officer-service"
import { complaintKeys } from "@/hooks/complaint/keys"
import type { ProposalStatus } from "@/types/agency"
import { officerKeys } from "./keys"

/** The officer's own tenders (oversight list). */
export function useOfficerTenders() {
  return useQuery({
    queryKey: officerKeys.tenders(),
    queryFn: () => officerService.listMyTenders(),
  })
}

/** Proposals submitted against one of the officer's tenders. */
export function useTenderProposals(tenderId: number | null) {
  return useQuery({
    queryKey: officerKeys.tenderProposals(tenderId ?? -1),
    queryFn: () => officerService.listTenderProposals(tenderId as number),
    enabled: tenderId != null,
  })
}

/** Detail for a single proposal. */
export function useProposal(proposalId: number | null) {
  return useQuery({
    queryKey: officerKeys.proposal(proposalId ?? -1),
    queryFn: () => officerService.getProposal(proposalId as number),
    enabled: proposalId != null,
  })
}

/** Publish a tender for a complaint, then refresh the complaint detail (which
 *  now carries the tender summary) so the proposal-review UI appears. */
export function useCreateTender() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      complaintId,
      title,
      description,
      closingDate,
    }: {
      complaintId: string
      title: string
      description?: string
      closingDate: string
    }) =>
      officerService.createTender(complaintId, {
        title,
        description,
        closingDate,
      }),
    onSuccess: (_data, { complaintId }) =>
      qc.invalidateQueries({ queryKey: complaintKeys.detail(complaintId) }),
  })
}

/** Shortlist / accept / reject a proposal, then refresh its detail + list. */
export function useUpdateProposalStatus(tenderId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      proposalId,
      status,
    }: {
      proposalId: number
      status: ProposalStatus
    }) => officerService.updateProposalStatus(proposalId, status),
    onSuccess: (_data, { proposalId }) => {
      qc.invalidateQueries({ queryKey: officerKeys.proposal(proposalId) })
      if (tenderId != null) {
        qc.invalidateQueries({
          queryKey: officerKeys.tenderProposals(tenderId),
        })
      }
    },
  })
}

/** Award a work order to the agency behind an accepted proposal. */
export function useCreateWorkOrder(tenderId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      proposalId,
      scopeOfWork,
      remarks,
    }: {
      proposalId: number
      scopeOfWork: string
      remarks?: string
    }) => officerService.createWorkOrder(proposalId, { scopeOfWork, remarks }),
    onSuccess: (_data, { proposalId }) => {
      qc.invalidateQueries({ queryKey: officerKeys.proposal(proposalId) })
      if (tenderId != null) {
        qc.invalidateQueries({
          queryKey: officerKeys.tenderProposals(tenderId),
        })
      }
    },
  })
}

/** Verify a completed work order, then refresh the complaint detail. */
export function useVerifyWorkOrder(complaintId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (workOrderId: number) =>
      officerService.verifyWorkOrder(workOrderId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: complaintKeys.detail(complaintId) }),
  })
}

/** Send a work order back as incomplete, then refresh the complaint detail. */
export function useMarkWorkOrderIncomplete(complaintId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      workOrderId,
      remarks,
    }: {
      workOrderId: number
      remarks: string
    }) => officerService.markWorkOrderIncomplete(workOrderId, remarks),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: complaintKeys.detail(complaintId) }),
  })
}
