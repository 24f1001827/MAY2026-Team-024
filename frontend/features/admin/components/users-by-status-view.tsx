"use client"

import { Button } from "@/components/shadcn/button"
import { UsersTable } from "@/features/admin/components/users-table"
import { useUsers } from "@/hooks/admin-users"
import type { UserStatus } from "@/types/user"

/**
 * A filtered users view for a single account status (Pending / Rejected /
 * Blocked pages). Fetches by status and reuses the shared `UsersTable`, whose
 * per-row "Manage" menu offers the appropriate transitions (e.g. approve a
 * pending user, unblock a blocked one). Acting on a row moves it out of the
 * list on refetch.
 */
export function UsersByStatusView({
  status,
  emptyLabel,
}: {
  status: UserStatus
  emptyLabel: string
}) {
  const { data, isLoading, isError, error, refetch } = useUsers({ status })
  const users = data ?? []

  if (isLoading) {
    return <StateCard>Loading…</StateCard>
  }

  if (isError) {
    return (
      <StateCard>
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load users."}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </StateCard>
    )
  }

  if (users.length === 0) {
    return <StateCard>{emptyLabel}</StateCard>
  }

  // The list is already scoped to one status, so hide the status filter.
  return <UsersTable users={users} showStatusFilter={false} />
}

function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}
