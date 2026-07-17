import Link from "next/link"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import {
  OfficerForm,
  OFFICER_FORM_ID,
} from "@/features/officer/components/officer-form"
import { requireRoles } from "@/lib/auth/current-user"
import { routes } from "@/nav"

export default async function NewOfficerPage() {
  await requireRoles(["Admin"])
  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title="New officer"
        description="Onboard an officer and assign their department."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.officers.href}>Cancel</Link>
            </Button>
            <Button type="submit" form={OFFICER_FORM_ID} variant="brand">
              Add officer
            </Button>
          </>
        }
      />
      <OfficerForm mode="create" />
    </div>
  )
}
