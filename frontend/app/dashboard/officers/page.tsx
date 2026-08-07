import { PageHeader } from "@/features/common/components/page-header"
import { OfficerDirectory } from "@/features/officer/components/officer-directory"
import { requireUser } from "@/lib/auth/current-user"

export default async function OfficersPage() {
  // Officer directory is visible to any authenticated user.
  await requireUser()

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Officers"
        description="Officers across departments and their availability."
      />
      <OfficerDirectory />
    </div>
  )
}
