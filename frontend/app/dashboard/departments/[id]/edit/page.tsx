import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import { DEPARTMENT_FORM_ID } from "@/features/department/components/department-form"
import { DepartmentEditForm } from "@/features/department/components/department-edit-form"
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

  const deptId = Number(id)

  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title="Edit department"
        description="Update this department's details."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.departments.detail(deptId).href}>Cancel</Link>
            </Button>
            <Button type="submit" form={DEPARTMENT_FORM_ID} variant="brand">
              Save changes
            </Button>
          </>
        }
      />
      <DepartmentEditForm id={deptId} />
    </div>
  )
}
