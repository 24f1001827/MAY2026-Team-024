import {
  TenderList,
  type TenderView,
} from "@/features/tender/components/tender-list"
import {
  mockComplaints,
  mockTenders,
  mockUsers,
} from "@/components/shared/mock-data"
import { requireRoles } from "@/lib/auth/current-user"

export default async function TendersPage() {
  const user = await requireRoles(["Admin", "Officer", "Agency"])
  const canManage = user.role === "Admin" || user.role === "Officer"

  const complaintById = new Map(mockComplaints.map((c) => [c.id, c.title]))
  const userById = new Map(mockUsers.map((u) => [u.id, u.name]))

  const tenders: TenderView[] = mockTenders.map((t) => ({
    id: t.id,
    complaintId: t.complaintId,
    complaintTitle: complaintById.get(t.complaintId) ?? "—",
    title: t.title,
    description: t.description,
    estimatedCost: t.estimatedCost,
    closingDate: t.closingDate,
    status: t.status,
    createdByName: userById.get(t.createdBy) ?? "—",
  }))

  return <TenderList tenders={tenders} canManage={canManage} />
}
