import { NotificationList } from "@/features/notification/components/notification-list"
import { mockNotifications } from "@/components/shared/mock-data"
import { requireUser } from "@/lib/auth/current-user"

export default async function NotificationsPage() {
  const user = await requireUser()

  const notifications = mockNotifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return <NotificationList initialNotifications={notifications} />
}
