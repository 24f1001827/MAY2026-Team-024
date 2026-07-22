import { notFound } from "next/navigation"

import {
  OfficerDetail,
} from "@/features/officer/components/officer-detail"
import type { OfficerView } from "@/features/officer/components/officer-list"
import {
  mockDepartments,
  mockOfficers,
  mockUsers,
} from "@/components/shared/mock-data"
import { requireRoles } from "@/lib/auth/current-user"

export default async function OfficerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRoles(["Admin"])
  const { id } = await params

  const officer = mockOfficers.find((o) => o.userId === id)
  if (!officer) notFound()

  const u = mockUsers.find((x) => x.id === officer.userId)
  const departmentName =
    mockDepartments.find((d) => d.id === officer.departmentId)?.name ??
    "Unassigned"

  const view: OfficerView = {
    userId: officer.userId,
    name: u?.name ?? "Unknown officer",
    email: u?.email ?? "",
    phone: u?.phone ?? "",
    departmentName,
    availabilityStatus: officer.availabilityStatus,
    currentWorkload: officer.currentWorkload,
    maxWorkload: officer.maxWorkload,
  }

  return <OfficerDetail officer={view} />
}
