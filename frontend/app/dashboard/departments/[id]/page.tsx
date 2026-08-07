import { redirect } from "next/navigation"

import { DepartmentProfile } from "@/features/department/components/department-profile"
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

  return <DepartmentProfile id={Number(id)} />
}
