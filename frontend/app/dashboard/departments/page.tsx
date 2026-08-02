import Link from "next/link"
import { redirect } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import {
  DepartmentsGridTable,
  type DepartmentCard,
} from "@/features/department/components/departments-grid-table"
import {
  mockComplaints,
  mockDepartments,
  mockOfficers,
  mockUsers,
} from "@/components/shared/mock-data"
import { getCurrentUser } from "@/lib/auth/current-user"
import { publicRoutes, routes } from "@/nav"

export default async function DepartmentsPage() {
  const user = await getCurrentUser()

  if (!user) redirect(publicRoutes.login)
  // Departments are managed by admins only.
  if (user.role !== "Admin") redirect(routes.href)

  const complaintCounts = new Map<number, number>()
  for (const c of mockComplaints) {
    complaintCounts.set(
      c.departmentId,
      (complaintCounts.get(c.departmentId) ?? 0) + 1
    )
  }

  const officerCounts = new Map<number, number>()
  for (const o of mockOfficers) {
    officerCounts.set(o.departmentId, (officerCounts.get(o.departmentId) ?? 0) + 1)
  }

  const userName = new Map(mockUsers.map((u) => [u.id, u.name]))

  const departments: DepartmentCard[] = mockDepartments.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    budget: d.budget,
    officerCount: officerCounts.get(d.id) ?? 0,
    complaintCount: complaintCounts.get(d.id) ?? 0,
    headOfficerName: d.headOfficerId
      ? (userName.get(d.headOfficerId) ?? null)
      : null,
  }))

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Departments"
        description="Civic departments that complaints are routed to."
        actions={
          <Button asChild variant="brand">
            <Link href={routes.departments.create}>
              <HugeiconsIcon icon={PlusSignIcon} />
              New department
            </Link>
          </Button>
        }
      />
      <DepartmentsGridTable departments={departments} canManage />
    </div>
  )
}
