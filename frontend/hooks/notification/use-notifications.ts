"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { notificationService } from "@/services/notification-service"
import { notificationKeys } from "./keys"

/**
 * The signed-in user's notifications. Refetches on window focus and every 60s
 * so the bell badge stays roughly live without a websocket.
 */
export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => notificationService.list(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

/** Mark one notification read, then refresh the list. */
export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: notificationKeys.list() }),
  })
}

/** Mark all notifications read, then refresh the list. */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: notificationKeys.list() }),
  })
}
