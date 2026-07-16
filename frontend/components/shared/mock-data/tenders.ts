import type { Tender } from "@/types/tender"

/** Dummy tenders. `complaintId` matches `mockComplaints`; `createdBy` is admin. */
export const mockTenders: Tender[] = [
  {
    id: 1,
    complaintId: "c4444444-4444-4444-8444-444444444444",
    createdBy: "11111111-1111-4111-8111-111111111111",
    title: "Emergency pipeline repair — Broadway",
    description:
      "Repair of the burst water main and road restoration at Broadway Market Road.",
    estimatedCost: 850000,
    closingDate: "2026-07-20T23:59:00.000Z",
    status: "Open",
    createdAt: "2026-07-03T12:00:00.000Z",
    updatedAt: "2026-07-03T12:00:00.000Z",
  },
  {
    id: 2,
    complaintId: "c1111111-1111-4111-8111-111111111111",
    createdBy: "11111111-1111-4111-8111-111111111111",
    title: "Road resurfacing — MG Road junction",
    description: "Patching and resurfacing of the damaged MG Road stretch.",
    estimatedCost: 420000,
    closingDate: "2026-07-15T23:59:00.000Z",
    status: "Awarded",
    createdAt: "2026-06-24T09:30:00.000Z",
    updatedAt: "2026-07-02T10:10:00.000Z",
  },
  {
    id: 3,
    complaintId: "c5555555-5555-4555-8555-555555555555",
    createdBy: "11111111-1111-4111-8111-111111111111",
    title: "Storm drain de-silting — Kaloor",
    description: "Clearing and de-silting of the blocked storm drain at Kaloor.",
    estimatedCost: 180000,
    closingDate: "2026-06-15T23:59:00.000Z",
    status: "Closed",
    createdAt: "2026-06-02T08:00:00.000Z",
    updatedAt: "2026-06-16T09:00:00.000Z",
  },
]
