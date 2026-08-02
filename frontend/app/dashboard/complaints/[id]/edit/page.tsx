import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import {
  ComplaintForm,
  COMPLAINT_FORM_ID,
} from "@/features/complaint/components/complaint-form"
import { mockComplaints } from "@/components/shared/mock-data"
import { getCurrentUser } from "@/lib/auth/current-user"
import { publicRoutes, routes } from "@/nav"

export default async function EditComplaintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) redirect(publicRoutes.login)
  // Only admins and citizens can edit the whole complaint.
  if (user.role !== "Admin" && user.role !== "Citizen") {
    redirect(routes.complaints.detail(id).href)
  }

  const complaint = mockComplaints.find((c) => c.id === id)
  if (!complaint) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title="Edit complaint"
        description="Update the details of this complaint."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.complaints.detail(complaint.id).href}>
                Cancel
              </Link>
            </Button>
            <Button type="submit" form={COMPLAINT_FORM_ID} variant="brand">
              Save changes
            </Button>
          </>
        }
      />
      <ComplaintForm mode="edit" complaint={complaint} />
    </div>
  )
}
