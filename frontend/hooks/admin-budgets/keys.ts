/**
 * Query-key factory for admin department budgets.
 */
export const adminBudgetKeys = {
  all: ["admin-budgets"] as const,
  list: () => [...adminBudgetKeys.all, "list"] as const,
  history: (departmentId: number) =>
    [...adminBudgetKeys.all, "history", departmentId] as const,
}
