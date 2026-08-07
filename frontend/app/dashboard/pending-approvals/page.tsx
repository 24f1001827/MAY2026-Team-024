import { PageHeader } from "@/features/common/components/page-header"
import { UsersByStatusView } from "@/features/admin/components/users-by-status-view"
import { requireRoles } from "@/lib/auth/current-user"

export default async function PendingApprovalsPage() {
  await requireRoles(["Admin"])

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Pending approvals"
        description="Officer and agency registrations awaiting your decision. Approve to grant access, or reject to deny it."
      />
      <UsersByStatusView
        status="PendingApproval"
        emptyLabel="No registrations are awaiting approval."
      />
    </div>
  )
}
