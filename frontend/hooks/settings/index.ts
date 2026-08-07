"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { settingsService } from "@/services/settings-service"

export const settingsKeys = {
  all: ["settings"] as const,
}

/** Read organization-wide settings. */
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => settingsService.get(),
  })
}

/** Admin: update organization-wide settings. */
export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (manualAllotment: boolean) =>
      settingsService.update(manualAllotment),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all }),
  })
}
