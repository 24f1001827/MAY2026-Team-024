import { BudgetsView } from "@/features/budget/components/budgets-view"
import { requireRoles } from "@/lib/auth/current-user"

export default async function BudgetsPage() {
  await requireRoles(["Admin"])
  return <BudgetsView />
}
