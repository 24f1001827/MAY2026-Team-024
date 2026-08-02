import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import {
  DepartmentForm,
  DEPARTMENT_FORM_ID,
} from "@/features/department/components/department-form"
import { getCurrentUser } from "@/lib/auth/current-user"
import { publicRoutes, routes } from "@/nav"

export default async function NewDepartmentPage() {
  const user = await getCurrentUser()

  if (!user) redirect(publicRoutes.login)
  if (user.role !== "Admin") redirect(routes.href)

  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title="New department"
        description="Add a civic department that complaints can be routed to."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.departments.href}>Cancel</Link>
            </Button>
            <Button type="submit" form={DEPARTMENT_FORM_ID} variant="brand">
              Create department
            </Button>
          </>
        }
      />
      <DepartmentForm mode="create" />
    </div>
  )
}
