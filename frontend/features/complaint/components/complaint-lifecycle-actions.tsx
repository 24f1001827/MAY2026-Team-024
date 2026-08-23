"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  ClipboardIcon,
  RefreshIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog"
import { NumericInput } from "@/components/shadcn/numeric-input"
import { Label } from "@/components/shadcn/label"
import { NativeSelect } from "@/components/shadcn/native-select"
import { Textarea } from "@/components/shadcn/textarea"
import {
  useSubmitReviewReport,
  useRequestBudget,
} from "@/hooks/officer"
import {
  useAllocateBudget,
  useCloseComplaint,
  useReopenComplaint,
} from "@/hooks/complaint"
import { ApiError } from "@/lib/api/api-client"
import { toast } from "@/lib/styles/toast-styles"
import { REVIEW_DECISIONS, type ReviewDecision } from "@/types/officer"
import type { Complaint } from "@/types/complaint"
import type { UserRole } from "@/types/user"

const DECISION_LABEL: Record<ReviewDecision, string> = {
  Resolved: "Resolved — no further work needed",
  TenderRequired: "Tender required — needs budget & contractor",
  Closed: "Closed — not actionable",
}

type DialogKind = "review" | "reopen" | "allocate" | null

/**
 * Role- and status-gated complaint actions that drive the real lifecycle
 * (review report → budget request → allocate → … → resolve → close/reopen).
 * Renders nothing when the current user has no applicable action, so the parent
 * can drop it in unconditionally.
 */
export function ComplaintLifecycleActions({
  complaint,
  currentRole,
  currentUserId,
}: {
  complaint: Complaint
  currentRole?: UserRole
  currentUserId?: string
}) {
  const [dialog, setDialog] = useState<DialogKind>(null)

  const submitReport = useSubmitReviewReport()
  const requestBudget = useRequestBudget()
  const allocateBudget = useAllocateBudget()
  const reopen = useReopenComplaint()
  const close = useCloseComplaint()

  const status = complaint.status
  const isOwner = currentRole === "Citizen" && complaint.citizenId === currentUserId
  const isAssignedOfficer =
    currentRole === "Officer" && complaint.assignedOfficerId === currentUserId
  const isAdmin = currentRole === "Admin"

  // Which actions apply, given role + status.
  const canReview = isAssignedOfficer && status === "UnderReview"
  const canRequestBudget = isAssignedOfficer && status === "ReportSubmitted"
  const canAllocate = isAdmin && status === "AwaitingBudget"
  const canClose = isOwner && status === "Resolved"
  const canReopen = isOwner && (status === "Resolved" || status === "Closed")

  const hasAny =
    canReview || canRequestBudget || canAllocate || canClose || canReopen
  if (!hasAny) return null

  const busy =
    submitReport.isPending ||
    requestBudget.isPending ||
    allocateBudget.isPending ||
    reopen.isPending ||
    close.isPending

  function fail(err: unknown, fallback: string) {
    toast.error(err instanceof ApiError ? err.message : fallback)
  }

  function handleRequestBudget() {
    requestBudget.mutate(complaint.id, {
      onSuccess: () => toast.success("Budget requested."),
      onError: (e) => fail(e, "Couldn’t request budget."),
    })
  }

  function handleClose() {
    close.mutate(complaint.id, {
      onSuccess: () => toast.success("Complaint closed."),
      onError: (e) => fail(e, "Couldn’t close the complaint."),
    })
  }

  return (
    <Card className="[--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {canReview && (
          <Button
            variant="brand"
            className="justify-start"
            disabled={busy}
            onClick={() => setDialog("review")}
          >
            <HugeiconsIcon icon={ClipboardIcon} />
            Submit review report
          </Button>
        )}
        {canRequestBudget && (
          <Button
            variant="brand"
            className="justify-start"
            disabled={busy}
            onClick={handleRequestBudget}
          >
            <HugeiconsIcon icon={Wallet01Icon} />
            Request budget
          </Button>
        )}
        {canAllocate && (
          <Button
            variant="brand"
            className="justify-start"
            disabled={busy}
            onClick={() => setDialog("allocate")}
          >
            <HugeiconsIcon icon={Wallet01Icon} />
            Allocate budget
          </Button>
        )}
        {canClose && (
          <Button
            variant="brand"
            className="justify-start"
            disabled={busy}
            onClick={handleClose}
          >
            <HugeiconsIcon icon={CheckmarkCircle02Icon} />
            Close complaint
          </Button>
        )}
        {canReopen && (
          <Button
            variant="outline"
            className="justify-start"
            disabled={busy}
            onClick={() => setDialog("reopen")}
          >
            <HugeiconsIcon icon={RefreshIcon} />
            Reopen complaint
          </Button>
        )}
      </CardContent>

      <ReviewReportDialog
        open={dialog === "review"}
        pending={submitReport.isPending}
        onClose={() => setDialog(null)}
        onSubmit={(input) =>
          submitReport.mutate(
            { complaintId: complaint.id, input },
            {
              onSuccess: () => {
                toast.success("Review report submitted.")
                setDialog(null)
              },
              onError: (e) => fail(e, "Couldn’t submit the report."),
            },
          )
        }
      />

      <AllocateBudgetDialog
        open={dialog === "allocate"}
        pending={allocateBudget.isPending}
        onClose={() => setDialog(null)}
        onSubmit={(amount) =>
          allocateBudget.mutate(
            { id: complaint.id, amount },
            {
              onSuccess: () => {
                toast.success("Budget allocated.")
                setDialog(null)
              },
              onError: (e) => fail(e, "Couldn’t allocate budget."),
            },
          )
        }
      />

      <ReopenDialog
        open={dialog === "reopen"}
        pending={reopen.isPending}
        onClose={() => setDialog(null)}
        onSubmit={(reason) =>
          reopen.mutate(
            { id: complaint.id, reason },
            {
              onSuccess: () => {
                toast.success("Complaint reopened.")
                setDialog(null)
              },
              onError: (e) => fail(e, "Couldn’t reopen the complaint."),
            },
          )
        }
      />
    </Card>
  )
}

function ReviewReportDialog({
  open,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean
  pending: boolean
  onClose: () => void
  onSubmit: (input: {
    findings: string
    decision: ReviewDecision
    estimatedCost?: number
    estimatedDurationDays?: number
  }) => void
}) {
  const [findings, setFindings] = useState("")
  const [decision, setDecision] = useState<ReviewDecision>("TenderRequired")
  const [cost, setCost] = useState("")
  const [days, setDays] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (findings.trim().length < 3) {
      toast.error("Add your inspection findings.")
      return
    }
    onSubmit({
      findings: findings.trim(),
      decision,
      estimatedCost: cost ? Number(cost) : undefined,
      estimatedDurationDays: days ? Number(days) : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit review report</DialogTitle>
          <DialogDescription>
            Record your inspection findings and how this complaint should
            proceed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="findings">Findings</Label>
            <Textarea
              id="findings"
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              rows={4}
              placeholder="What you observed on inspection…"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="decision">Decision</Label>
            <NativeSelect
              id="decision"
              value={decision}
              onChange={(e) => setDecision(e.target.value as ReviewDecision)}
            >
              {REVIEW_DECISIONS.map((d) => (
                <option key={d} value={d}>
                  {DECISION_LABEL[d]}
                </option>
              ))}
            </NativeSelect>
          </div>
          {decision === "TenderRequired" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cost">Estimated cost (₹)</Label>
                <NumericInput
                  id="cost"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="days">Duration (days)</Label>
                <NumericInput
                  id="days"
                  maxDigits={4}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={pending}>
              {pending ? "Submitting…" : "Submit report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AllocateBudgetDialog({
  open,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean
  pending: boolean
  onClose: () => void
  onSubmit: (amount: number) => void
}) {
  const [amount, setAmount] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a valid budget amount.")
      return
    }
    onSubmit(n)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Allocate budget</DialogTitle>
          <DialogDescription>
            Set the budget for this complaint so the officer can publish a
            tender.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (₹)</Label>
            <NumericInput
              id="amount"
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
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={pending}>
              {pending ? "Allocating…" : "Allocate budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ReopenDialog({
  open,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean
  pending: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
}) {
  const [reason, setReason] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (reason.trim().length < 10) {
      toast.error("Give a reason (at least 10 characters).")
      return
    }
    onSubmit(reason.trim())
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reopen complaint</DialogTitle>
          <DialogDescription>
            Tell us why this complaint should be reopened.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why the issue isn’t actually resolved…"
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={pending}>
              {pending ? "Reopening…" : "Reopen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
