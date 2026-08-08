/**
 * lib/utils/department/normalize.ts
 *
 * Maps the backend department response (snake_case, `budget` as a current-FY
 * summary object from the budget module, `head_officer_name` from the head
 * relationship) to the frontend `Department` shape. Type-only imports → no
 * runtime deps (bun-testable).
 */

import type {
  Department,
  DepartmentBudgetSummary,
} from "@/types/department"

/** The budget summary object the backend embeds on a department. */
export interface RawDepartmentBudget {
  financial_year: string
  total?: string | number | null
  allocated?: string | number | null
  available?: string | number | null
}

/** Department row exactly as the backend serializes it. */
export interface RawDepartment {
  id: number
  name: string
  description?: string | null
  budget?: RawDepartmentBudget | null
  head_officer_id?: string | null
  head_officer_name?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export function normalizeDepartmentBudget(
  raw: RawDepartmentBudget | null | undefined,
): DepartmentBudgetSummary | null {
  if (!raw) return null
  const total = Number(raw.total ?? 0)
  const allocated = Number(raw.allocated ?? 0)
  return {
    financialYear: raw.financial_year,
    total,
    allocated,
    available: raw.available != null ? Number(raw.available) : total - allocated,
  }
}

export function normalizeDepartment(raw: RawDepartment): Department {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? "",
    budget: normalizeDepartmentBudget(raw.budget),
    headOfficerId: raw.head_officer_id ?? null,
    headOfficerName: raw.head_officer_name ?? null,
    createdAt: raw.created_at ?? "",
    updatedAt: raw.updated_at ?? "",
  }
}
