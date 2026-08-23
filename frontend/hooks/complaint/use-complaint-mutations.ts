"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { complaintService } from "@/services/complaint-service"
import { adminBudgetKeys } from "@/hooks/admin-budgets/keys"
import type {
  CreateComplaintRequest,
  DisputeOutcome,
  UpdateComplaintRequest,
} from "@/types/complaint"
import { complaintKeys } from "./keys"

/** File a complaint, then refresh the complaint lists. */
export function useCreateComplaint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      images,
    }: {
      input: CreateComplaintRequest
      images?: File[]
    }) => complaintService.create(input, images),
    onSuccess: () => qc.invalidateQueries({ queryKey: complaintKeys.all }),
  })
}

/** Update a complaint, then refresh the complaint lists + this detail. */
export function useUpdateComplaint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      images,
    }: {
      id: string
      input: UpdateComplaintRequest
      images?: File[]
    }) => complaintService.update(id, input, images),
    onSuccess: () => qc.invalidateQueries({ queryKey: complaintKeys.all }),
  })
}

/** Delete a complaint, then refresh the complaint lists. */
export function useDeleteComplaint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => complaintService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: complaintKeys.all }),
  })
}

/** Citizen owner: reopen a complaint, then refresh its detail + lists. */
export function useReopenComplaint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      complaintService.reopen(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: complaintKeys.all }),
  })
}

/** Citizen owner: close a resolved complaint, then refresh its detail + lists. */
export function useCloseComplaint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => complaintService.close(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: complaintKeys.all }),
  })
}

export function useDisputeCluster() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      complaintService.disputeCluster(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: complaintKeys.all }),
  })
}

/** Staff: uphold a dispute (splitting the complaint out) or reject it. */
export function useResolveDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      outcome,
      note,
    }: {
      id: string
      outcome: DisputeOutcome
      note?: string
    }) => complaintService.resolveDispute(id, outcome, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: complaintKeys.all }),
  })
}

export function useLinkCluster() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, targetComplaintId }: { id: string; targetComplaintId: string }) =>
      complaintService.linkCluster(id, targetComplaintId),
    onSuccess: () => qc.invalidateQueries({ queryKey: complaintKeys.all }),
  })
}

export function useUnlinkCluster() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => complaintService.unlinkCluster(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: complaintKeys.all }),
  })
}

/** Admin: add a remark to a complaint, then refresh its detail (timeline). */
export function useAddRemark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      complaintService.addRemark(id, message),
    onSuccess: (_data, { id }) =>
      qc.invalidateQueries({ queryKey: complaintKeys.detail(id) }),
  })
}

/** Admin: allocate budget to a complaint, then refresh its detail + lists +
 *  the department budget cards (utilization changes). */
export function useAllocateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      complaintService.allocateBudget(id, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: complaintKeys.all })
      qc.invalidateQueries({ queryKey: adminBudgetKeys.list() })
    },
  })
}
