"use client"

import { TendersListView } from "@/features/tender/components/tenders-list-view"
import { useOfficerTenders } from "@/hooks/officer"

/** An officer's own published tenders. */
export function OfficerTendersView() {
  const { data, isPending, isError, error, refetch } = useOfficerTenders()
  return (
    <TendersListView
      tenders={data}
      isPending={isPending}
      isError={isError}
      error={error}
      refetch={refetch}
      title="Tenders"
      description="Tenders you’ve published. Open the linked complaint to review proposals and award work."
      emptyHint="Publish a tender from a complaint once its budget is allocated."
    />
  )
}
