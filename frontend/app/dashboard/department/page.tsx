import { redirect } from "next/navigation"

import { DepartmentDashboardView } from "@/features/department/components/department-dashboard-view"
import { requireRoles } from "@/lib/auth/current-user"
import { routes } from "@/nav"

export default async function MyDepartmentPage() {
  const user = await requireRoles(["Officer", "Admin"])

  // Admins don't have an own-department dashboard (this endpoint resolves the
  // caller's department); send them to the departments list instead.
  if (user.role === "Admin") redirect(routes.departments.href)

  return (
    <DepartmentDashboardView currentRole={user.role} currentUserId={user.id} />
  )
}
