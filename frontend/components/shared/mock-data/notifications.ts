import type { Notification } from "@/types/notification"

/** Dummy notifications for the admin user (`mockUsers[0]`). */
export const mockNotifications: Notification[] = [
  {
    id: 1,
    userId: "11111111-1111-4111-8111-111111111111",
    type: "SLABreach",
    title: "SLA breach warning",
    message: "Complaint 'Water pipeline leakage' is approaching its SLA deadline.",
    isRead: false,
    readAt: null,
    createdAt: "2026-07-06T08:00:00.000Z",
  },
  {
    id: 2,
    userId: "11111111-1111-4111-8111-111111111111",
    type: "TenderPublished",
    title: "Tender published",
    message: "Tender 'Emergency pipeline repair — Broadway' is now open for proposals.",
    isRead: false,
    readAt: null,
    createdAt: "2026-07-03T12:05:00.000Z",
  },
  {
    id: 3,
    userId: "11111111-1111-4111-8111-111111111111",
    type: "StatusChange",
    title: "Complaint resolved",
    message: "Complaint 'Blocked storm drain' has been marked as Resolved.",
    isRead: true,
    readAt: "2026-06-19T09:00:00.000Z",
    createdAt: "2026-06-18T16:50:00.000Z",
  },
  {
    id: 4,
    userId: "11111111-1111-4111-8111-111111111111",
    type: "Assignment",
    title: "New assignment",
    message: "You assigned 'Large pothole on MG Road' to the Public Works team.",
    isRead: true,
    readAt: "2026-06-22T10:05:00.000Z",
    createdAt: "2026-06-22T10:00:00.000Z",
  },
]
