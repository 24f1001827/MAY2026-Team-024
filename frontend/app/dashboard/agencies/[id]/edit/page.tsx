import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import {
  AgencyForm,
  AGENCY_FORM_ID,
} from "@/features/agency/components/agency-form"
import type { AgencyView } from "@/features/agency/components/agency-list"
import { mockAgencies, mockUsers } from "@/components/shared/mock-data"
import { requireRoles } from "@/lib/auth/current-user"
import { routes } from "@/nav"

export default async function EditAgencyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRoles(["Admin", "Officer"])
  const { id } = await params

  const agency = mockAgencies.find((a) => a.id === id)
  if (!agency) notFound()

  const u = mockUsers.find((x) => x.id === agency.id)
  const view: AgencyView = {
    id: agency.id,
    name: u?.name ?? "",
    email: u?.email ?? "",
    phone: u?.phone ?? "",
    registrationNumber: agency.registrationNumber,
    licenseNumber: agency.licenseNumber,
    contactPerson: agency.contactPerson,
    currentProjects: agency.currentProjects,
    maxProjects: agency.maxProjects,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title="Edit agency"
        description="Update this agency's registration and contact details."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.agencies.detail(agency.id).href}>Cancel</Link>
            </Button>
            <Button type="submit" form={AGENCY_FORM_ID} variant="brand">
              Save changes
            </Button>
          </>
        }
      />
      <AgencyForm mode="edit" agency={view} />
    </div>
  )
}
