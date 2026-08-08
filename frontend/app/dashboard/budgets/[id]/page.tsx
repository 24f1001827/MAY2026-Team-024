import { notFound } from "next/navigation"

import { DepartmentBudgetDetailView } from "@/features/budget/components/department-budget-detail-view"
import { requireRoles } from "@/lib/auth/current-user"

export default async function DepartmentBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRoles(["Admin"])
  const { id } = await params
  const departmentId = Number(id)
  if (!Number.isInteger(departmentId)) notFound()
  return <DepartmentBudgetDetailView departmentId={departmentId} />
}
