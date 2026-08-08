"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
import { Pagination } from "@/features/common/components/pagination"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/notification"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/styles/toast-styles"
import { formatDate } from "@/lib/utils/common/format"
import { notificationIcon } from "@/lib/utils/notification/display"

const PAGE_SIZE = 15

/**
 * The signed-in user's notifications: unread-highlighted list, mark-one/mark-all
 * read (real mutations), and pagination. Self-fetching via `useNotifications`.
 */
export function NotificationList() {
  const { data, isPending, isError, error, refetch } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const [page, setPage] = useState(1)

  const notifications = useMemo(() => data ?? [], [data])
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const totalPages = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const rows = notifications.slice(startIndex, startIndex + PAGE_SIZE)

  function handleMarkAll() {
    if (unreadCount === 0) return
    markAllRead.mutate(undefined, {
      onSuccess: () =>
        toast.success("All caught up", {
          description: "Marked all notifications as read.",
        }),
      onError: () => toast.error("Couldn’t mark all as read."),
    })
  }

  function handleItemClick(id: number, isRead: boolean) {
    if (isRead) return
    markRead.mutate(id)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Notifications"
        description={
          unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={unreadCount === 0 || markAllRead.isPending}
          >
            Mark all read
          </Button>
        }
      />

      {isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <p className="text-sm font-medium text-destructive">
            Couldn’t load notifications.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Please try again."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 text-xs font-medium text-brand underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : isPending ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <p className="text-sm text-muted-foreground">Loading notifications…</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {rows.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() =>
                    handleItemClick(notification.id, notification.isRead)
                  }
                  className={cn(
                    "flex w-full gap-3 rounded-xl border p-4 text-left transition-colors",
                    notification.isRead
                      ? "border-border bg-card hover:bg-accent"
                      : "border-brand/30 bg-brand/5 hover:bg-brand/10",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-lg",
                      notification.isRead
                        ? "bg-muted text-muted-foreground"
                        : "bg-brand/10 text-brand",
                    )}
                  >
                    <HugeiconsIcon
                      icon={notificationIcon(notification.type)}
                      size={18}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="size-1.5 shrink-0 rounded-full bg-brand" />
                      )}
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
