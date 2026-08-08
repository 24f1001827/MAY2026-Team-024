"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { adminBudgetService } from "@/services/admin-budget-service"
import type { AddBudgetInput } from "@/types/budget"
import { adminBudgetKeys } from "./keys"

/** All department budgets across years. */
export function useAdminBudgets() {
  return useQuery({
    queryKey: adminBudgetKeys.list(),
    queryFn: () => adminBudgetService.list(),
  })
}

/** Fund a department's budget, then refresh the list + that dept's history. */
export function useAddBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddBudgetInput) => adminBudgetService.add(input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: adminBudgetKeys.list() })
      qc.invalidateQueries({
        queryKey: adminBudgetKeys.history(input.departmentId),
      })
    },
  })
}

/** A department's budget history (additions + allocations). */
export function useDepartmentBudgetHistory(departmentId: number | null) {
  return useQuery({
    queryKey: adminBudgetKeys.history(departmentId ?? -1),
    queryFn: () => adminBudgetService.history(departmentId as number),
    enabled: departmentId != null,
  })
}
