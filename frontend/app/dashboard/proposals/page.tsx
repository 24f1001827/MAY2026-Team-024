import { AgencyProposals } from "@/features/agency/components/agency-proposals"
import { requireRoles } from "@/lib/auth/current-user"

export default async function ProposalsPage() {
  await requireRoles(["Agency"])
  return <AgencyProposals />
}
