import { AgencyTenders } from "@/features/agency/components/agency-tenders"
import { OfficerTendersView } from "@/features/tender/components/officer-tenders-view"
import { AdminTendersView } from "@/features/tender/components/admin-tenders-view"
import { requireRoles } from "@/lib/auth/current-user"

export default async function TendersPage() {
  // Agencies bid on open tenders; officers oversee the ones they've published;
  // admins see every tender across departments (read-only). Each row links to
  // the linked complaint for full management.
  const user = await requireRoles(["Officer", "Agency", "Admin"])

  if (user.role === "Agency") return <AgencyTenders />
  if (user.role === "Admin") return <AdminTendersView />
  return <OfficerTendersView />
}
