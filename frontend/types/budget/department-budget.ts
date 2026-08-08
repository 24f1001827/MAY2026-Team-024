/**
 * A department's budget for one financial year. `available = total - allocated`
 * (utilization). Amounts arrive from the backend as strings and are parsed to
 * numbers.
 */
export interface DepartmentBudget {
  id: number
  departmentId: number
  departmentName: string
  financialYear: string
  totalAmount: number
  allocatedAmount: number
  availableAmount: number
}

export interface AddBudgetInput {
  departmentId: number
  amount: number
  financialYear?: string
}

/** One budget ledger entry (addition or allocation). */
export interface BudgetLedgerEntry {
  id: number
  financialYear: string
  entryType: "Addition" | "Allocation"
  amount: number
  complaintId: string | null
  complaintTitle: string | null
  note: string | null
  createdAt: string
}

/** A department's budget history, split for the two history tabs. */
export interface DepartmentBudgetHistory {
  additions: BudgetLedgerEntry[]
  allocations: BudgetLedgerEntry[]
}

/**
 * One department's aggregated budget position (summed across its financial
 * years) — the department card on the Budgets page.
 */
export interface DepartmentBudgetGroup {
  departmentId: number
  departmentName: string
  totalAmount: number
  allocatedAmount: number
  availableAmount: number
  years: DepartmentBudget[]
}
