"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { departmentService } from "@/services/department-service"
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "@/types/department"
import { departmentKeys } from "./keys"

/** Create a department, then refresh every department query. */
export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDepartmentInput) =>
      departmentService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: departmentKeys.all }),
  })
}

/** Update a department, then refresh every department query. */
export function useUpdateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateDepartmentInput }) =>
      departmentService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: departmentKeys.all }),
  })
}

/** Soft-delete a department, then refresh every department query. */
export function useDeleteDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => departmentService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: departmentKeys.all }),
  })
}
