import Link from "next/link"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import {
  AgencyForm,
  AGENCY_FORM_ID,
} from "@/features/agency/components/agency-form"
import { requireRoles } from "@/lib/auth/current-user"
import { routes } from "@/nav"

export default async function NewAgencyPage() {
  await requireRoles(["Admin", "Officer"])
  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title="New agency"
        description="Register an agency that can bid on and execute tenders."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.agencies.href}>Cancel</Link>
            </Button>
            <Button type="submit" form={AGENCY_FORM_ID} variant="brand">
              Register agency
            </Button>
          </>
        }
      />
      <AgencyForm mode="create" />
    </div>
  )
}
