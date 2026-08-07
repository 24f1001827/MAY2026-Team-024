"use client"

import { notFound } from "next/navigation"

import { ApiError } from "@/lib/api/api-client"
import { DepartmentForm } from "@/features/department/components/department-form"
import { useDepartment } from "@/hooks/department"

/**
 * Loads a department by id, then mounts the edit form. The form uses
 * uncontrolled `defaultValue` inputs, so it must not render until the record is
 * available.
 */
export function DepartmentEditForm({ id }: { id: number }) {
  const { data, isPending, isError, error } = useDepartment(id)

  if (isError && error instanceof ApiError && error.isNotFound) notFound()

  if (isPending) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading department…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center text-sm text-destructive">
        {error instanceof Error ? error.message : "Couldn’t load this department."}
      </div>
    )
  }

  return <DepartmentForm mode="edit" department={data} />
}
