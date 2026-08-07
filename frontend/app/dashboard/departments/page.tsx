import Link from "next/link"
import { redirect } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import { DepartmentsView } from "@/features/department/components/departments-view"
import { getCurrentUser } from "@/lib/auth/current-user"
import { publicRoutes, routes } from "@/nav"

export default async function DepartmentsPage() {
  const user = await getCurrentUser()

  if (!user) redirect(publicRoutes.login)
  // Departments are managed by admins only.
  if (user.role !== "Admin") redirect(routes.href)

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
      <DepartmentsView />
    </div>
  )
}
