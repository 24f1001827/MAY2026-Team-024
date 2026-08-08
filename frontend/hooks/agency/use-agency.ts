"use client"

import { useQuery } from "@tanstack/react-query"

import { agencyService } from "@/services/agency-service"
import { agencyKeys } from "./keys"

/** Open tenders the agency can bid on. */
export function useOpenTenders() {
  return useQuery({
    queryKey: agencyKeys.openTenders(),
    queryFn: () => agencyService.listOpenTenders(),
  })
}

/** Detail for a single tender. */
export function useAgencyTender(id: number | null) {
  return useQuery({
    queryKey: agencyKeys.tender(id ?? -1),
    queryFn: () => agencyService.getTender(id as number),
    enabled: id != null,
  })
}

/** Proposals the logged-in agency has submitted. */
export function useAgencyProposals() {
  return useQuery({
    queryKey: agencyKeys.proposals(),
    queryFn: () => agencyService.listProposals(),
  })
}

/** Work orders assigned to the logged-in agency. */
export function useAgencyWorkOrders() {
  return useQuery({
    queryKey: agencyKeys.workOrders(),
    queryFn: () => agencyService.listWorkOrders(),
  })
}

/** Detail for a single work order. */
export function useAgencyWorkOrder(id: number | null) {
  return useQuery({
    queryKey: agencyKeys.workOrder(id ?? -1),
    queryFn: () => agencyService.getWorkOrder(id as number),
    enabled: id != null,
  })
}
