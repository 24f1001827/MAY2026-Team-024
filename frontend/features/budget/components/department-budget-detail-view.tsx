"use client"

import { useMemo } from "react"

import { Card, CardContent } from "@/components/shadcn/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs"
import { PageHeader } from "@/features/common/components/page-header"
import {
  useAdminBudgets,
  useDepartmentBudgetHistory,
} from "@/hooks/admin-budgets"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils/common/format"
import type { BudgetLedgerEntry } from "@/types/budget"

function HistoryList({
  entries,
  isPending,
  emptyLabel,
  showComplaint,
}: {
  entries: BudgetLedgerEntry[]
  isPending: boolean
  emptyLabel: string
  showComplaint?: boolean
}) {
  if (isPending) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
    )
  }
  if (entries.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    )
  }
  return (
    <ul className="divide-y divide-border">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {showComplaint ? e.complaintTitle ?? "Complaint" : "Funding added"}
            </p>
            <p className="text-xs text-muted-foreground">
              FY {e.financialYear}
              {e.createdAt ? ` · ${formatDate(e.createdAt)}` : ""}
            </p>
          </div>
          <span
            className={
              "shrink-0 text-sm font-semibold " +
              (showComplaint
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400")
            }
          >
            {showComplaint ? "−" : "+"}
            {formatCurrency(e.amount)}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function DepartmentBudgetDetailView({
  departmentId,
}: {
  departmentId: number
}) {
  const { data: budgets } = useAdminBudgets()
  const { data: history, isPending } = useDepartmentBudgetHistory(departmentId)

  const rows = useMemo(
    () => (budgets ?? []).filter((b) => b.departmentId === departmentId),
    [budgets, departmentId],
  )

  const summary = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.totalAmount, 0)
    const allocated = rows.reduce((s, r) => s + r.allocatedAmount, 0)
    return {
      name: rows[0]?.departmentName ?? `Department #${departmentId}`,
      total,
      allocated,
      available: total - allocated,
      pct: total > 0 ? Math.min(100, (allocated / total) * 100) : 0,
    }
  }, [rows, departmentId])

  const high = summary.pct >= 90

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={summary.name}
        description={`${rows.length} ${
          rows.length === 1 ? "year" : "years"
        } funded`}
      />

      {/* Aggregate */}
      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent className="space-y-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                high ? "bg-red-500" : "bg-brand",
              )}
              style={{ width: `${summary.pct}%` }}
            />
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Total
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {formatCurrency(summary.total)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Utilized
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {formatCurrency(summary.allocated)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Available
              </dt>
              <dd
                className={cn(
                  "text-sm font-medium",
                  high
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {formatCurrency(summary.available)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent>
          <Tabs defaultValue="additions">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="additions">Addition history</TabsTrigger>
              <TabsTrigger value="utilization">Utilization history</TabsTrigger>
            </TabsList>
            <TabsContent value="additions" className="mt-2">
              <HistoryList
                entries={history?.additions ?? []}
                isPending={isPending}
                emptyLabel="No budget additions yet."
              />
            </TabsContent>
            <TabsContent value="utilization" className="mt-2">
              <HistoryList
                entries={history?.allocations ?? []}
                isPending={isPending}
                emptyLabel="No budget utilized yet."
                showComplaint
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
