/**
 * lib/utils/department/normalize.ts
 *
 * Maps the backend department response (snake_case, `budget` as a string,
 * `head_officer_name` from the head relationship) to the frontend `Department`
 * shape. Type-only imports → no runtime deps (bun-testable).
 */

import type { Department } from "@/types/department"

/** Department row exactly as the backend serializes it. */
export interface RawDepartment {
  id: number
  name: string
  description?: string | null
  budget?: string | null
  head_officer_id?: string | null
  head_officer_name?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export function normalizeDepartment(raw: RawDepartment): Department {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? "",
    // Backend serializes Decimal as a string ("25000000.00").
    budget: raw.budget != null ? Number(raw.budget) : 0,
    headOfficerId: raw.head_officer_id ?? null,
    headOfficerName: raw.head_officer_name ?? null,
    createdAt: raw.created_at ?? "",
    updatedAt: raw.updated_at ?? "",
  }
}
