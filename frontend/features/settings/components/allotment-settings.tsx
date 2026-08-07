"use client"

import { useState } from "react"

import { Button } from "@/components/shadcn/button"
import { Checkbox } from "@/components/shadcn/checkbox"
import { getApiErrorMessage } from "@/lib/api/error-message"
import { toast } from "@/lib/styles/toast-styles"
import { useSettings, useUpdateSettings } from "@/hooks/settings"

/** Card shell shared by the loading and loaded states. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          Complaint allotment
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Controls how complaints routed to a department are assigned.
        </p>
      </div>
      {children}
    </div>
  )
}

/** The editable form, mounted only once the current value is known. */
function AllotmentForm({ initial }: { initial: boolean }) {
  const [manual, setManual] = useState(initial)
  const updateSettings = useUpdateSettings()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateSettings.mutate(manual, {
      onSuccess: () =>
        toast.success("Allotment settings saved", {
          description: manual
            ? "Complaints will wait for a department head to allot them."
            : "Complaints will be auto-assigned to the least-loaded officer.",
        }),
      onError: (error) =>
        toast.error("Couldn’t save settings", {
          description: getApiErrorMessage(error, "Please try again."),
        }),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex items-start gap-3">
        <Checkbox
          checked={manual}
          onCheckedChange={(v) => setManual(v === true)}
          className="mt-0.5"
        />
        <span className="space-y-0.5">
          <span className="block text-sm font-medium text-foreground">
            Manual allotment
          </span>
          <span className="block text-sm text-muted-foreground">
            When on, complaints wait in the department&apos;s queue for its head
            to allot. When off, they&apos;re auto-assigned to the least-loaded
            officer.
          </span>
        </span>
      </label>

      <Button type="submit" variant="brand" disabled={updateSettings.isPending}>
        {updateSettings.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  )
}

/**
 * Admin control for the organization-wide complaint-allotment mode. Loads the
 * current value, then mounts the form seeded with it (no setState-in-effect).
 */
export function AllotmentSettings() {
  const { data, isPending, isError } = useSettings()

  if (isPending) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </Shell>
    )
  }

  if (isError) {
    return (
      <Shell>
        <p className="text-sm text-destructive">Couldn’t load settings.</p>
      </Shell>
    )
  }

  return (
    <Shell>
      <AllotmentForm initial={data.manualAllotment} />
    </Shell>
  )
}
