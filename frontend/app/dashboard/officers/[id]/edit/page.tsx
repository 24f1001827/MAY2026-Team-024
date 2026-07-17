import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import {
  OfficerForm,
  OFFICER_FORM_ID,
} from "@/features/officer/components/officer-form"
import type { OfficerView } from "@/features/officer/components/officer-list"
import {
  mockDepartments,
  mockOfficers,
  mockUsers,
} from "@/components/shared/mock-data"
import { requireRoles } from "@/lib/auth/current-user"
import { routes } from "@/nav"

export default async function EditOfficerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRoles(["Admin"])
  const { id } = await params

  const officer = mockOfficers.find((o) => o.userId === id)
  if (!officer) notFound()

  const u = mockUsers.find((x) => x.id === officer.userId)
  const view: OfficerView & { departmentId: number } = {
    userId: officer.userId,
    name: u?.name ?? "",
    email: u?.email ?? "",
    phone: u?.phone ?? "",
    departmentName:
      mockDepartments.find((d) => d.id === officer.departmentId)?.name ?? "",
    departmentId: officer.departmentId,
    availabilityStatus: officer.availabilityStatus,
    currentWorkload: officer.currentWorkload,
    maxWorkload: officer.maxWorkload,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title="Edit officer"
        description="Update this officer's details or assignment."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.officers.detail(officer.userId).href}>
                Cancel
              </Link>
            </Button>
            <Button type="submit" form={OFFICER_FORM_ID} variant="brand">
              Save changes
            </Button>
          </>
        }
      />
      <OfficerForm mode="edit" officer={view} />
    </div>
  )
}
