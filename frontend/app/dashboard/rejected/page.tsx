import { PageHeader } from "@/features/common/components/page-header"
import { UsersByStatusView } from "@/features/admin/components/users-by-status-view"
import { requireRoles } from "@/lib/auth/current-user"

export default async function RejectedUsersPage() {
  await requireRoles(["Admin"])

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Rejected"
        description="Registrations that were rejected. Rejected users cannot sign in — approve one to reinstate access."
      />
      <UsersByStatusView
        status="Rejected"
        emptyLabel="No rejected registrations."
      />
    </div>
  )
}
