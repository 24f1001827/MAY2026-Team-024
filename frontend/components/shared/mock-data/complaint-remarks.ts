import type { ComplaintRemark } from "@/types/complaint"

/**
 * Dummy complaint activity. `complaintId` matches `mockComplaints` and
 * `authorId` matches `mockUsers` (officers/agencies posting updates).
 */
export const mockComplaintRemarks: ComplaintRemark[] = [
  {
    id: "r1111111-1111-4111-8111-111111111111",
    complaintId: "c1111111-1111-4111-8111-111111111111",
    authorId: "22222222-2222-4222-8222-222222222222",
    authorName: "Priya Nair",
    authorRole: "Officer",
    message: "Assigned to Public Works. Inspected the site — repair scheduled.",
    statusFrom: "Submitted",
    statusTo: "Assigned",
    createdAt: "2026-06-22T10:00:00.000Z",
  },
  {
    id: "r2222222-2222-4222-8222-222222222222",
    complaintId: "c4444444-4444-4444-8444-444444444444",
    authorId: "77777777-7777-4777-8777-777777777777",
    authorName: "BuildRight Infra Pvt Ltd",
    authorRole: "Agency",
    message: "Excavation started; pipeline section replacement in progress.",
    statusFrom: "TenderAllotted",
    statusTo: "WorkInProgress",
    createdAt: "2026-07-01T09:30:00.000Z",
  },
  {
    id: "r3333333-3333-4333-8333-333333333333",
    complaintId: "c4444444-4444-4444-8444-444444444444",
    authorId: "22222222-2222-4222-8222-222222222222",
    authorName: "Priya Nair",
    authorRole: "Officer",
    message: "Verified progress on site. On track for completion this week.",
    statusFrom: null,
    statusTo: null,
    createdAt: "2026-07-05T14:15:00.000Z",
  },
  {
    id: "r4444444-4444-4444-8444-444444444444",
    complaintId: "c5555555-5555-4555-8555-555555555555",
    authorId: "33333333-3333-4333-8333-333333333333",
    authorName: "Rahul Verma",
    authorRole: "Officer",
    message: "Drain cleared and water flow restored. Closing the complaint.",
    statusFrom: "WorkInProgress",
    statusTo: "Resolved",
    createdAt: "2026-07-03T11:00:00.000Z",
  },
]
