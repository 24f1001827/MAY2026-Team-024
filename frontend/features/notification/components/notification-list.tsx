"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Agreement02Icon,
  Alert02Icon,
  CheckmarkBadge02Icon,
  CheckmarkCircle02Icon,
  Notification01Icon,
  RefreshIcon,
  Task01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/styles/toast-styles"
import { formatDate } from "@/lib/utils/common/format"
import type { Notification, NotificationType } from "@/types/notification"

const TYPE_ICON: Record<NotificationType, IconSvgElement> = {
  StatusChange: RefreshIcon,
  Assignment: Task01Icon,
  InspectionDone: CheckmarkBadge02Icon,
  TenderPublished: Agreement02Icon,
  SLABreach: Alert02Icon,
  BudgetPending: Wallet01Icon,
  Closure: CheckmarkCircle02Icon,
}

export function NotificationList({
  initialNotifications,
}: {
  initialNotifications: Notification[]
}) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  function markAllRead() {
    if (unreadCount === 0) return
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    toast.success("All caught up", {
      description: "Marked all notifications as read.",
    })
  }

  function markRead(id: number) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You're all caught up."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          Mark all read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <button
                type="button"
                onClick={() => markRead(notification.id)}
                className={cn(
                  "flex w-full gap-3 rounded-xl border p-4 text-left transition-colors",
                  notification.isRead
                    ? "border-border bg-card hover:bg-accent"
                    : "border-brand/30 bg-brand/5 hover:bg-brand/10"
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg",
                    notification.isRead
                      ? "bg-muted text-muted-foreground"
                      : "bg-brand/10 text-brand"
                  )}
                >
                  <HugeiconsIcon
                    icon={TYPE_ICON[notification.type] ?? Notification01Icon}
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
      )}
    </div>
  )
}
