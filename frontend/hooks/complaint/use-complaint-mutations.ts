"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { complaintService } from "@/services/complaint-service"
import type {
  CreateComplaintRequest,
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
