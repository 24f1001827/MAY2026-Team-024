import { PageHeader } from "@/features/common/components/page-header"
import { UsersByStatusView } from "@/features/admin/components/users-by-status-view"
import { requireRoles } from "@/lib/auth/current-user"

export default async function BlockedUsersPage() {
  await requireRoles(["Admin"])

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Blocked"
        description="Accounts that have been blocked from signing in. Unblock one to restore access."
      />
      <UsersByStatusView
        status="Blocked"
        emptyLabel="No blocked accounts."
      />
    </div>
  )
}
