import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import {
  DepartmentForm,
  DEPARTMENT_FORM_ID,
  type DepartmentHeadOption,
} from "@/features/department/components/department-form"
import {
  mockDepartments,
  mockOfficers,
  mockUsers,
} from "@/components/shared/mock-data"
import { getCurrentUser } from "@/lib/auth/current-user"
import { publicRoutes, routes } from "@/nav"

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) redirect(publicRoutes.login)
  if (user.role !== "Admin") redirect(routes.href)

  const department = mockDepartments.find((d) => d.id === Number(id))
  if (!department) notFound()

  const userName = new Map(mockUsers.map((u) => [u.id, u.name]))
  const officers: DepartmentHeadOption[] = mockOfficers
    .filter((o) => o.departmentId === department.id)
    .map((o) => ({
      userId: o.userId,
      name: userName.get(o.userId) ?? "Unknown officer",
    }))

  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title="Edit department"
        description="Update this department's details."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.departments.detail(department.id).href}>
                Cancel
              </Link>
            </Button>
            <Button type="submit" form={DEPARTMENT_FORM_ID} variant="brand">
              Save changes
            </Button>
          </>
        }
      />
      <DepartmentForm mode="edit" department={department} officers={officers} />
    </div>
  )
}
