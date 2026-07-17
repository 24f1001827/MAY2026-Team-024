import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import {
  TenderForm,
  TENDER_FORM_ID,
} from "@/features/tender/components/tender-form"
import type { TenderView } from "@/features/tender/components/tender-list"
import {
  mockComplaints,
  mockTenders,
  mockUsers,
} from "@/components/shared/mock-data"
import { requireRoles } from "@/lib/auth/current-user"
import { routes } from "@/nav"

export default async function EditTenderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRoles(["Admin", "Officer"])
  const { id } = await params

  const tender = mockTenders.find((t) => t.id === Number(id))
  if (!tender) notFound()

  const view: TenderView = {
    id: tender.id,
    complaintId: tender.complaintId,
    complaintTitle:
      mockComplaints.find((c) => c.id === tender.complaintId)?.title ?? "—",
    title: tender.title,
    description: tender.description,
    estimatedCost: tender.estimatedCost,
    closingDate: tender.closingDate,
    status: tender.status,
    createdByName: mockUsers.find((u) => u.id === tender.createdBy)?.name ?? "—",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title="Edit tender"
        description="Update this tender's scope, budget, or deadline."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.tenders.detail(tender.id).href}>Cancel</Link>
            </Button>
            <Button type="submit" form={TENDER_FORM_ID} variant="brand">
              Save changes
            </Button>
          </>
        }
      />
      <TenderForm mode="edit" tender={view} />
    </div>
  )
}
