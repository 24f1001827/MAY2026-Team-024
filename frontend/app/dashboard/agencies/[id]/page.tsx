import { notFound } from "next/navigation"

import { AgencyDetail } from "@/features/agency/components/agency-detail"
import type { AgencyView } from "@/features/agency/components/agency-list"
import { mockAgencies, mockUsers } from "@/components/shared/mock-data"
import { requireRoles } from "@/lib/auth/current-user"

export default async function AgencyDetailPage({
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
    name: u?.name ?? "Unknown agency",
    email: u?.email ?? "",
    phone: u?.phone ?? "",
    registrationNumber: agency.registrationNumber,
    licenseNumber: agency.licenseNumber,
    contactPerson: agency.contactPerson,
    currentProjects: agency.currentProjects,
    maxProjects: agency.maxProjects,
  }

  return <AgencyDetail agency={view} canManage />
}
