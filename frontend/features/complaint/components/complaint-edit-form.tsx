"use client"

import { notFound } from "next/navigation"

import { ApiError } from "@/lib/api/api-client"
import { ComplaintForm } from "@/features/complaint/components/complaint-form"
import { useComplaint } from "@/hooks/complaint"

/**
 * Loads a complaint by id, then mounts the edit form. The form uses
 * uncontrolled `defaultValue` inputs, so it must not render until the record is
 * available.
 */
export function ComplaintEditForm({ id }: { id: string }) {
  const { data, isPending, isError, error } = useComplaint(id)

  if (isError && error instanceof ApiError && error.isNotFound) notFound()

  if (isPending) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading complaint…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center text-sm text-destructive">
        {error instanceof Error ? error.message : "Couldn’t load this complaint."}
      </div>
    )
  }

  return <ComplaintForm mode="edit" complaint={data.complaint} />
}
