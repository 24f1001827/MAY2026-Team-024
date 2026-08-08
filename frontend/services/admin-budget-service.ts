/**
 * services/admin-budget-service.ts
 *
 * Admin year-wise department budgets, via `/api/admin/budgets` (admin-only).
 *
 *   GET  /admin/budgets   → DepartmentBudgetSchema[]  (list)
 *   POST /admin/budgets   → DepartmentBudgetSchema     (create/top-up)
 */

import { api } from "@/lib/api/api-client"
import type {
  AddBudgetInput,
  BudgetLedgerEntry,
  DepartmentBudget,
  DepartmentBudgetHistory,
} from "@/types/budget"

/** Backend success envelope: `{ success, message, data }`. */
interface Envelope<T> {
  data: T
}

interface RawDepartmentBudget {
  id: number
  department_id: number
  department_name?: string | null
  financial_year: string
  total_amount?: string | number | null
  allocated_amount?: string | number | null
  available_amount?: string | number | null
}

function toBudget(raw: RawDepartmentBudget): DepartmentBudget {
  const total = Number(raw.total_amount ?? 0)
  const allocated = Number(raw.allocated_amount ?? 0)
  return {
    id: raw.id,
    departmentId: raw.department_id,
    departmentName: raw.department_name ?? "—",
    financialYear: raw.financial_year,
    totalAmount: total,
    allocatedAmount: allocated,
    availableAmount:
      raw.available_amount != null
        ? Number(raw.available_amount)
        : total - allocated,
  }
}

export const adminBudgetService = {
  /** All department budgets across years. */
  async list(): Promise<DepartmentBudget[]> {
    const res = await api.get<Envelope<RawDepartmentBudget[]>>("/admin/budgets")
    return (res.data ?? []).map(toBudget)
  },

  /** Fund a department's budget for a financial year (create or top up). */
  async add(input: AddBudgetInput): Promise<DepartmentBudget> {
    const res = await api.post<Envelope<RawDepartmentBudget>>("/admin/budgets", {
      department_id: input.departmentId,
      amount: input.amount,
      ...(input.financialYear ? { financial_year: input.financialYear } : {}),
    })
    return toBudget(res.data)
  },

  /** A department's budget history (additions + allocations). */
  async history(departmentId: number): Promise<DepartmentBudgetHistory> {
    const res = await api.get<
      Envelope<{
        additions: RawLedgerEntry[]
        allocations: RawLedgerEntry[]
      }>
    >(`/admin/budgets/departments/${departmentId}/history`)
    return {
      additions: (res.data?.additions ?? []).map(toLedgerEntry),
      allocations: (res.data?.allocations ?? []).map(toLedgerEntry),
    }
  },
}

interface RawLedgerEntry {
  id: number
  financial_year: string
  entry_type: string
  amount?: string | number | null
  complaint_id?: string | null
  complaint_title?: string | null
  note?: string | null
  created_at?: string | null
}

function toLedgerEntry(raw: RawLedgerEntry): BudgetLedgerEntry {
  return {
    id: raw.id,
    financialYear: raw.financial_year,
    entryType: raw.entry_type === "Allocation" ? "Allocation" : "Addition",
    amount: Number(raw.amount ?? 0),
    complaintId: raw.complaint_id ?? null,
    complaintTitle: raw.complaint_title ?? null,
    note: raw.note ?? null,
    createdAt: raw.created_at ?? "",
  }
}
