"use client"

import { useMemo } from "react"

import { PageHeader } from "@/features/common/components/page-header"
import {
  AgenciesGridTable,
  type AgencyCard,
} from "@/features/agency/components/agencies-grid-table"
import { useAdminAgencies } from "@/hooks/admin-agencies"

/**
 * Admin agency directory (read-only) backed by `GET /admin/agencies`. Agencies
 * self-register, so there's no create/edit here.
 */
export function AdminAgenciesView() {
  const { data, isPending, isError, error, refetch } = useAdminAgencies()

  const agencies = useMemo<AgencyCard[]>(
    () =>
      (data ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        contactPerson: a.contactPerson,
        registrationNumber: a.registrationNumber,
        currentProjects: a.currentProjects,
        maxProjects: a.maxProjects,
        status: a.status,
      })),
    [data],
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Agencies"
        description="Registered agencies that bid on tenders and execute work orders."
      />

      {isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <p className="text-sm font-medium text-destructive">
            Couldn’t load agencies.
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
      ) : isPending ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading agencies…
        </div>
      ) : (
        <AgenciesGridTable agencies={agencies} canManage={false} />
      )}
    </div>
  )
}
