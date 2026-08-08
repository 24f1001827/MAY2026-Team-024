import { notFound } from "next/navigation"

import { AgencyWorkOrderDetail } from "@/features/agency/components/agency-work-order-detail"
import { requireRoles } from "@/lib/auth/current-user"

export default async function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRoles(["Agency"])
  const { id } = await params
  const numericId = Number(id)
  if (!Number.isInteger(numericId)) notFound()
  return <AgencyWorkOrderDetail id={numericId} />
}
