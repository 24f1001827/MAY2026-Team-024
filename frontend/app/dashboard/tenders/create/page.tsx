import Link from "next/link"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import {
  TenderForm,
  TENDER_FORM_ID,
} from "@/features/tender/components/tender-form"
import { requireRoles } from "@/lib/auth/current-user"
import { routes } from "@/nav"

export default async function NewTenderPage() {
  await requireRoles(["Admin", "Officer"])
  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title="New tender"
        description="Publish a tender for a complaint that needs field work."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.tenders.href}>Cancel</Link>
            </Button>
            <Button type="submit" form={TENDER_FORM_ID} variant="brand">
              Publish tender
            </Button>
          </>
        }
      />
      <TenderForm mode="create" />
    </div>
  )
}
