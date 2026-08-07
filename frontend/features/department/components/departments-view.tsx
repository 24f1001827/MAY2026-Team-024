"use client"

import {
  DepartmentsGridTable,
  type DepartmentCard,
} from "@/features/department/components/departments-grid-table"
import { useDepartments } from "@/hooks/department"

/**
 * Client wrapper that loads departments from the API and feeds the grid.
 * Officer/complaint counts are intentionally omitted — those modules aren't
 * integrated yet; the card shows the head officer (resolved by the backend).
 */
export function DepartmentsView() {
  const { data, isPending, isError, error, refetch } = useDepartments()

  if (isPending) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading departments…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
        <p className="text-sm font-medium text-destructive">
          Couldn’t load departments.
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
    )
  }

  const departments: DepartmentCard[] = data.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    budget: d.budget,
    headOfficerName: d.headOfficerName ?? null,
  }))

  return <DepartmentsGridTable departments={departments} canManage />
}
