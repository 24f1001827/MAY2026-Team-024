"use client"

import { TendersListView } from "@/features/tender/components/tenders-list-view"
import { useAdminTenders } from "@/hooks/admin-tenders"

/** All tenders in the system (admin oversight). */
export function AdminTendersView() {
  const { data, isPending, isError, error, refetch } = useAdminTenders()
  return (
    <TendersListView
      tenders={data}
      isPending={isPending}
      isError={isError}
      error={error}
      refetch={refetch}
      title="Tenders"
      description="Every tender across departments. Open the linked complaint for full details."
      emptyHint="Tenders appear here once officers publish them against complaints."
    />
  )
}
