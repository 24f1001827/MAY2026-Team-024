import { notFound } from "next/navigation"

import { AgencyTenderDetail } from "@/features/agency/components/agency-tender-detail"
import { requireRoles } from "@/lib/auth/current-user"

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Only agencies have a standalone tender detail (to bid). Officers manage
  // tenders from the linked complaint; admins have no tender role.
  await requireRoles(["Agency"])
  const { id } = await params

  const numericId = Number(id)
  if (!Number.isInteger(numericId)) notFound()
  return <AgencyTenderDetail id={numericId} />
}
