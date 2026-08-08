import { NotificationList } from "@/features/notification/components/notification-list"
import { requireUser } from "@/lib/auth/current-user"

export default async function NotificationsPage() {
  // Any authenticated user; the list itself is fetched client-side (scoped to
  // the caller by the backend from their token).
  await requireUser()
  return <NotificationList />
}
