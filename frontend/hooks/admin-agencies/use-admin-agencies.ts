"use client"

import { useQuery } from "@tanstack/react-query"

import { adminAgencyService } from "@/services/admin-agency-service"
import { adminAgencyKeys } from "./keys"

/** All agencies (admin directory). */
export function useAdminAgencies() {
  return useQuery({
    queryKey: adminAgencyKeys.list(),
    queryFn: () => adminAgencyService.list(),
  })
}

/** A single agency by id. */
export function useAdminAgency(id: string) {
  return useQuery({
    queryKey: adminAgencyKeys.detail(id),
    queryFn: () => adminAgencyService.get(id),
    enabled: Boolean(id),
  })
}

/** Work orders the agency is executing. */
export function useAdminAgencyWorkOrders(id: string) {
  return useQuery({
    queryKey: [...adminAgencyKeys.detail(id), "work-orders"],
    queryFn: () => adminAgencyService.listWorkOrders(id),
    enabled: Boolean(id),
  })
}
