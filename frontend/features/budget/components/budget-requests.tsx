"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  ClipboardIcon,
  Comment01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog"
import { Input } from "@/components/shadcn/input"
import { NumericInput } from "@/components/shadcn/numeric-input"
import { Label } from "@/components/shadcn/label"
import { Textarea } from "@/components/shadcn/textarea"
import {
  useAllComplaints,
  useAllocateBudget,
  useAddRemark,
  useReviewReport,
} from "@/hooks/complaint"
import { usePublicDepartments } from "@/hooks/department"
import { ApiError } from "@/lib/api/api-client"
import { formatCurrency, formatDate } from "@/lib/utils/common/format"
import { toast } from "@/lib/styles/toast-styles"
import type { Complaint } from "@/types/complaint"

/**
 * Complaints an officer has requested budget for (status AwaitingBudget). Per
 * complaint the admin can view the officer's report, add a remark to the
 * timeline, and allocate budget (drawn from the department's current-FY budget).
 */
export function BudgetRequests() {
  const { data, isPending, isError } = useAllComplaints()
  const { data: departments } = usePublicDepartments()
  const allocate = useAllocateBudget()

  const [allocTarget, setAllocTarget] = useState<Complaint | null>(null)
  const [amount, setAmount] = useState("")
  const [reportTarget, setReportTarget] = useState<Complaint | null>(null)
  const [remarkTarget, setRemarkTarget] = useState<Complaint | null>(null)

  const deptName = useMemo(
    () => new Map((departments ?? []).map((d) => [d.id, d.name])),
    [departments],
  )

  const requests = useMemo(
    () => (data ?? []).filter((c) => c.status === "AwaitingBudget"),
    [data],
  )

  async function handleAllocate(e: React.FormEvent) {
    e.preventDefault()
    if (!allocTarget) return
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a valid amount.")
      return
    }
    try {
      await allocate.mutateAsync({ id: allocTarget.id, amount: n })
      toast.success("Budget allocated.")
      setAllocTarget(null)
      setAmount("")
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t allocate budget.",
      )
    }
  }

  return (
    <Card className="[--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Budget requests
          {requests.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              {requests.length} pending
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isError ? (
          <p className="p-6 text-center text-sm text-destructive">
            Couldn’t load budget requests.
          </p>
        ) : isPending ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Loading requests…
          </p>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={22}
              className="text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              No pending budget requests.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {requests.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {c.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {deptName.get(c.departmentId) ??
                      `Department #${c.departmentId}`}
                    {c.city ? ` · ${c.city}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReportTarget(c)}
                  >
                    <HugeiconsIcon icon={ClipboardIcon} size={14} />
                    Report
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRemarkTarget(c)}
                  >
                    <HugeiconsIcon icon={Comment01Icon} size={14} />
                    Remark
                  </Button>
                  <Button
                    size="sm"
                    variant="brand"
                    onClick={() => {
                      setAllocTarget(c)
                      setAmount("")
                    }}
                  >
                    <HugeiconsIcon icon={Wallet01Icon} size={14} />
                    Allocate
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* Allocate */}
      <Dialog
        open={allocTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAllocTarget(null)
            setAmount("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate budget</DialogTitle>
            <DialogDescription>
              Fund “{allocTarget?.title}”. Drawn from{" "}
              {allocTarget
                ? deptName.get(allocTarget.departmentId) ?? "the department"
                : ""}
              ’s current-year budget.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAllocate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reqAmount">Amount (₹)</Label>
              <NumericInput
                id="reqAmount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2500000"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAllocTarget(null)}
                disabled={allocate.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={allocate.isPending}>
                {allocate.isPending ? "Allocating…" : "Allocate budget"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ReportDialog
        complaint={reportTarget}
        onClose={() => setReportTarget(null)}
      />
      <RemarkDialog
        complaint={remarkTarget}
        onClose={() => setRemarkTarget(null)}
      />
    </Card>
  )
}

function ReportDialog({
  complaint,
  onClose,
}: {
  complaint: Complaint | null
  onClose: () => void
}) {
  const { data: report, isPending } = useReviewReport(complaint?.id ?? null)

  return (
    <Dialog open={complaint !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review report</DialogTitle>
          <DialogDescription>
            Officer’s inspection findings for “{complaint?.title}”.
          </DialogDescription>
        </DialogHeader>
        {isPending ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Loading report…
          </p>
        ) : !report ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No review report has been submitted for this complaint.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Findings
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {report.findings}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Decision
                </dt>
                <dd className="mt-0.5 text-sm text-foreground">
                  {report.decision}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Estimated cost
                </dt>
                <dd className="mt-0.5 text-sm text-foreground">
                  {report.estimatedCost != null
                    ? formatCurrency(report.estimatedCost)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Duration
                </dt>
                <dd className="mt-0.5 text-sm text-foreground">
                  {report.estimatedDurationDays != null
                    ? `${report.estimatedDurationDays} days`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Reviewed
                </dt>
                <dd className="mt-0.5 text-sm text-foreground">
                  {report.reviewDate ? formatDate(report.reviewDate) : "—"}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function RemarkDialog({
  complaint,
  onClose,
}: {
  complaint: Complaint | null
  onClose: () => void
}) {
  const addRemark = useAddRemark()
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!complaint) return
    if (message.trim().length < 2) {
      toast.error("Enter a remark.")
      return
    }
    try {
      await addRemark.mutateAsync({ id: complaint.id, message: message.trim() })
      toast.success("Remark added.")
      setMessage("")
      onClose()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t add the remark.",
      )
    }
  }

  return (
    <Dialog
      open={complaint !== null}
      onOpenChange={(open) => {
        if (!open) {
          setMessage("")
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add remark</DialogTitle>
          <DialogDescription>
            Add a note to “{complaint?.title}”’s activity timeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="remarkMsg">Remark</Label>
            <Textarea
              id="remarkMsg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Note for the record…"
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={addRemark.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={addRemark.isPending}>
              {addRemark.isPending ? "Adding…" : "Add remark"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
