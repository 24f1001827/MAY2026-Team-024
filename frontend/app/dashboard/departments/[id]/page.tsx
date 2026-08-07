import { redirect } from "next/navigation"

import { AdminDepartmentDashboardView } from "@/features/department/components/admin-department-dashboard-view"
import { getCurrentUser } from "@/lib/auth/current-user"
import { publicRoutes, routes } from "@/nav"

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) redirect(publicRoutes.login)
  // Department management is admin-only.
  if (user.role !== "Admin") redirect(routes.href)

  return <AdminDepartmentDashboardView id={Number(id)} />
}
