import { AdminAgenciesView } from "@/features/agency/components/admin-agencies-view"
import { requireRoles } from "@/lib/auth/current-user"

export default async function AgenciesPage() {
  await requireRoles(["Admin"])
  return <AdminAgenciesView />
}
