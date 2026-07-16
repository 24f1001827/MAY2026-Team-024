import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import {
  ComplaintForm,
  COMPLAINT_FORM_ID,
} from "@/features/complaint/components/complaint-form"
import { mockUsers } from "@/components/shared/mock-data"
import { MOCK_SESSION_COOKIE } from "@/lib/auth/mock-session"
import { publicRoutes, routes } from "@/nav"

export default async function NewComplaintPage() {
  const store = await cookies()
  const user = mockUsers.find(
    (u) => u.id === store.get(MOCK_SESSION_COOKIE)?.value
  )

  if (!user) redirect(publicRoutes.login)
  // Only admins and citizens can file a complaint.
  if (user.role !== "Admin" && user.role !== "Citizen") {
    redirect(routes.complaints.href)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title="File a complaint"
        description="Report a civic issue with its location and category."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.complaints.href}>Cancel</Link>
            </Button>
            <Button type="submit" form={COMPLAINT_FORM_ID} variant="brand">
              Submit complaint
            </Button>
          </>
        }
      />
      <ComplaintForm mode="create" />
    </div>
  )
}
