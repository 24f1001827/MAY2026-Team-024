import { AdminAgencyDetailView } from "@/features/agency/components/admin-agency-detail-view"
import { requireRoles } from "@/lib/auth/current-user"

export default async function AgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRoles(["Admin"])
  const { id } = await params
  return <AdminAgencyDetailView id={id} />
}
