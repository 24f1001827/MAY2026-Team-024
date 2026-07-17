import { notFound } from "next/navigation"

import { TenderDetail } from "@/features/tender/components/tender-detail"
import type { TenderView } from "@/features/tender/components/tender-list"
import {
  mockComplaints,
  mockTenders,
  mockUsers,
} from "@/components/shared/mock-data"
import { requireRoles } from "@/lib/auth/current-user"

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireRoles(["Admin", "Officer", "Agency"])
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

  const canManage = user.role === "Admin" || user.role === "Officer"
  return <TenderDetail tender={view} canManage={canManage} />
}
