/**
 * services/admin-tender-service.ts
 *
 * Admin tender oversight — every tender in the system, via `/api/admin/tenders`
 * (admin-only). Same row shape as the officer tenders list.
 */

import { api } from "@/lib/api/api-client"
import type { OfficerTenderListItem, TenderStatus } from "@/types/tender"

interface Envelope<T> {
  data: T
}

interface RawTender {
  id: number
  complaint_id: string
  complaint_title?: string | null
  title: string
  status: string
  estimated_cost?: string | number | null
  closing_date: string
  created_at: string
}

export const adminTenderService = {
  /** Every tender in the system. */
  async list(): Promise<OfficerTenderListItem[]> {
    const res = await api.get<Envelope<RawTender[]>>("/admin/tenders")
    return (res.data ?? []).map((t) => ({
      id: t.id,
      complaintId: t.complaint_id,
      complaintTitle: t.complaint_title ?? "—",
      title: t.title,
      status: t.status as TenderStatus,
      estimatedCost: Number(t.estimated_cost ?? 0),
      closingDate: t.closing_date,
      createdAt: t.created_at,
    }))
  },
}
