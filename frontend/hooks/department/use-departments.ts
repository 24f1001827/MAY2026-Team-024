"use client"

import { useQuery } from "@tanstack/react-query"

import { departmentService } from "@/services/department-service"
import { departmentKeys } from "./keys"

/**
 * Public department list for the officer registration dropdown. Departments
 * rarely change, so this is cached generously — the list is small and shared
 * across every registration.
 */
export function usePublicDepartments() {
  return useQuery({
    queryKey: departmentKeys.publicList(),
    queryFn: () => departmentService.listPublic(),
    staleTime: 5 * 60 * 1000, // 5 min — department names are near-static.
  })
}

/** Admin: full list of departments (with head officer name). */
export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.list(),
    queryFn: () => departmentService.list(),
  })
}

/** Admin: a single department by id. */
export function useDepartment(id: number) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => departmentService.getById(id),
    enabled: Number.isFinite(id),
  })
}
