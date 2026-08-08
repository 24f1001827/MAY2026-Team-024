"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon, Wallet01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { Card, CardContent } from "@/components/shadcn/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog"
import { Input } from "@/components/shadcn/input"
import { Label } from "@/components/shadcn/label"
import { NativeSelect } from "@/components/shadcn/native-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcn/empty"
import { PageHeader } from "@/features/common/components/page-header"
import { BudgetRequests } from "@/features/budget/components/budget-requests"
import { useAdminBudgets, useAddBudget } from "@/hooks/admin-budgets"
import { usePublicDepartments } from "@/hooks/department"
import { ApiError } from "@/lib/api/api-client"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/common/format"
import { toast } from "@/lib/styles/toast-styles"
import type { DepartmentBudgetGroup } from "@/types/budget"
import { routes } from "@/nav"

/** Current Indian financial year (Apr–Mar), e.g. "2026-27". */
function currentFinancialYear(): string {
  const now = new Date()
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${start}-${String(start + 1).slice(2)}`
}

function DepartmentBudgetCard({
  group,
  onOpen,
}: {
  group: DepartmentBudgetGroup
  onOpen: () => void
}) {
  const pct =
    group.totalAmount > 0
      ? Math.min(100, (group.allocatedAmount / group.totalAmount) * 100)
      : 0
  const high = pct >= 90

  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-brand/40 hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {group.departmentName}
          </p>
          <p className="text-xs text-muted-foreground">
            {group.years.length}{" "}
            {group.years.length === 1 ? "year" : "years"} funded
          </p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {pct.toFixed(0)}% used
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", high ? "bg-red-500" : "bg-brand")}
          style={{ width: `${pct}%` }}
        />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Total
          </dt>
          <dd className="text-sm font-medium text-foreground">
            {formatCurrency(group.totalAmount)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Utilized
          </dt>
          <dd className="text-sm font-medium text-foreground">
            {formatCurrency(group.allocatedAmount)}
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
            {formatCurrency(group.availableAmount)}
          </dd>
        </div>
      </dl>
    </button>
  )
}

export function BudgetsView() {
  const router = useRouter()
  const { data, isPending, isError, error, refetch } = useAdminBudgets()
  const { data: departments } = usePublicDepartments()
  const add = useAddBudget()

  const [open, setOpen] = useState(false)
  const [departmentId, setDepartmentId] = useState("")
  const [financialYear, setFinancialYear] = useState(currentFinancialYear())
  const [amount, setAmount] = useState("")

  // One card per department: group the per-year rows and aggregate.
  const groups = useMemo<DepartmentBudgetGroup[]>(() => {
    const map = new Map<number, DepartmentBudgetGroup>()
    for (const b of data ?? []) {
      const g =
        map.get(b.departmentId) ??
        ({
          departmentId: b.departmentId,
          departmentName: b.departmentName,
          totalAmount: 0,
          allocatedAmount: 0,
          availableAmount: 0,
          years: [],
        } satisfies DepartmentBudgetGroup)
      g.totalAmount += b.totalAmount
      g.allocatedAmount += b.allocatedAmount
      g.availableAmount += b.availableAmount
      g.years.push(b)
      map.set(b.departmentId, g)
    }
    return Array.from(map.values()).sort((a, b) =>
      a.departmentName.localeCompare(b.departmentName),
    )
  }, [data])

  const totals = useMemo(
    () => ({
      funded: groups.reduce((s, g) => s + g.totalAmount, 0),
      utilized: groups.reduce((s, g) => s + g.allocatedAmount, 0),
    }),
    [groups],
  )

  function resetForm() {
    setDepartmentId("")
    setFinancialYear(currentFinancialYear())
    setAmount("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const deptNum = Number(departmentId)
    const amt = Number(amount)
    if (!Number.isInteger(deptNum) || deptNum <= 0) {
      toast.error("Select a department.")
      return
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid amount.")
      return
    }
    try {
      await add.mutateAsync({
        departmentId: deptNum,
        amount: amt,
        financialYear: financialYear.trim() || undefined,
      })
      toast.success("Budget updated.")
      setOpen(false)
      resetForm()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t update the budget.",
      )
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Budgets"
        description="Year-wise department budgets, utilization, and officer budget requests."
        actions={
          <Button variant="brand" onClick={() => setOpen(true)}>
            <HugeiconsIcon icon={PlusSignIcon} />
            Add budget
          </Button>
        }
      />

      <Tabs defaultValue="departments">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        {/* Departments */}
        <TabsContent value="departments" className="mt-4 space-y-4">
          {groups.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="[--card-spacing:--spacing(5)]">
                <CardContent>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Total funded
                  </p>
                  <p className="mt-1 text-xl font-bold text-foreground">
                    {formatCurrency(totals.funded)}
                  </p>
                </CardContent>
              </Card>
              <Card className="[--card-spacing:--spacing(5)]">
                <CardContent>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Total utilized
                  </p>
                  <p className="mt-1 text-xl font-bold text-foreground">
                    {formatCurrency(totals.utilized)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
              <p className="text-sm font-medium text-destructive">
                Couldn’t load budgets.
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
              Loading budgets…
            </div>
          ) : groups.length === 0 ? (
            <Empty className="py-12">
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Wallet01Icon} size={24} />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No budgets yet</EmptyTitle>
                <EmptyDescription>
                  Add a department budget for a financial year to get started.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <DepartmentBudgetCard
                  key={g.departmentId}
                  group={g}
                  onOpen={() =>
                    router.push(routes.budgets.detail(g.departmentId).href)
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Requests */}
        <TabsContent value="requests" className="mt-4">
          <BudgetRequests />
        </TabsContent>
      </Tabs>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) resetForm()
          setOpen(next)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add budget</DialogTitle>
            <DialogDescription>
              Fund a department for a financial year. If a budget already exists
              for that year, this tops it up.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dept">Department</Label>
              <NativeSelect
                id="dept"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">Select a department…</option>
                {(departments ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fy">Financial year</Label>
                <Input
                  id="fy"
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  placeholder="2026-27"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amt">Amount (₹)</Label>
                <Input
                  id="amt"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000000"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={add.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={add.isPending}>
                {add.isPending ? "Saving…" : "Add budget"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
