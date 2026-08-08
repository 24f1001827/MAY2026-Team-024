"use client"

import { useQuery } from "@tanstack/react-query"

import { adminTenderService } from "@/services/admin-tender-service"

export const adminTenderKeys = {
  all: ["admin-tenders"] as const,
  list: () => [...adminTenderKeys.all, "list"] as const,
}

/** Every tender in the system (admin oversight). */
export function useAdminTenders() {
  return useQuery({
    queryKey: adminTenderKeys.list(),
    queryFn: () => adminTenderService.list(),
  })
}
