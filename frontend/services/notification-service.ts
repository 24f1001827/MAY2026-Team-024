/**
 * services/notification-service.ts
 *
 * Notification operations for the signed-in user, via this app's
 * `/api/notifications*` route handlers (Bearer forwarded server-side). The
 * backend scopes every call to the caller from their token — there is no
 * user_id parameter.
 *
 * Endpoints:
 *   GET   /notifications              → Notification[]   (list)
 *   PATCH /notifications/{id}/read    → { id, is_read }   (ack — refetch)
 *   PATCH /notifications/read-all     → void              (ack — refetch)
 *
 * Note: the backend serializes timestamps with Flask's default encoder
 * (RFC-1123, e.g. "Thu, 01 Jan 2026 12:00:00 GMT"), not ISO. We normalize to
 * ISO here so the rest of the app can treat them uniformly.
 */

import { api } from "@/lib/api/api-client"
import type { Notification, NotificationType } from "@/types/notification"

/** Backend success envelope: `{ success, message, data }`. */
interface Envelope<T> {
  data: T
}

interface RawNotification {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  read_at?: string | null
  created_at?: string | null
}

/** RFC-1123 or ISO → ISO; null/invalid → null. */
function toIso(value: string | null | undefined): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function toNotification(raw: RawNotification): Notification {
  return {
    id: raw.id,
    type: raw.type as NotificationType,
    title: raw.title,
    message: raw.message,
    isRead: Boolean(raw.is_read),
    readAt: toIso(raw.read_at),
    createdAt: toIso(raw.created_at) ?? new Date(0).toISOString(),
  }
}

export const notificationService = {
  /** The signed-in user's notifications, newest first. */
  async list(): Promise<Notification[]> {
    const res = await api.get<Envelope<RawNotification[]>>("/notifications")
    return (res.data ?? [])
      .map(toNotification)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  /** Mark a single notification read. */
  async markRead(id: number): Promise<void> {
    await api.patch(`/notifications/${id}/read`, {})
  },

  /** Mark every notification read. */
  async markAllRead(): Promise<void> {
    await api.patch("/notifications/read-all", {})
  },
}
