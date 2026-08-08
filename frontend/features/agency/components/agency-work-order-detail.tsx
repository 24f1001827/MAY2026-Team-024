"use client"

import { useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Calendar03Icon,
  CheckmarkCircle02Icon,
  File01Icon,
  PlayIcon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { PageHeader } from "@/features/common/components/page-header"
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
import { Skeleton } from "@/components/shadcn/skeleton"
import { useAgencyWorkOrder, useUpdateWorkOrderStatus } from "@/hooks/agency"
import type { WorkOrderStatus } from "@/types/agency"
import { ApiError } from "@/lib/api/api-client"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/common/format"
import { WORK_ORDER_STATUS_META } from "@/lib/utils/agency/display"
import { toast } from "@/lib/styles/toast-styles"
import { routes } from "@/nav"

function Row({
  icon,
  label,
  children,
}: {
  icon: IconSvgElement
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 text-muted-foreground">
        <HugeiconsIcon icon={icon} size={16} />
      </span>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
      </div>
    </div>
  )
}

export function AgencyWorkOrderDetail({ id }: { id: number }) {
  const { data: wo, isPending, isError, error } = useAgencyWorkOrder(id)
  const update = useUpdateWorkOrderStatus()

  const [completeOpen, setCompleteOpen] = useState(false)
  const [proof, setProof] = useState<File | null>(null)

  async function setStatus(status: WorkOrderStatus, completionProof?: File) {
    try {
      await update.mutateAsync({
        workOrderId: id,
        status,
        completionProof,
      })
      toast.success(
        `Marked ${WORK_ORDER_STATUS_META[status].label.toLowerCase()}.`,
      )
      setCompleteOpen(false)
      setProof(null)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t update the status.",
      )
    }
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault()
    if (!proof) {
      toast.error("Completion proof is required.")
      return
    }
    await setStatus("Completed", proof)
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError || !wo) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
        <p className="text-sm font-medium text-destructive">
          Couldn’t load this work order.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {error instanceof Error ? error.message : "Please try again."}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={routes.workOrders.href}>Back to work orders</Link>
        </Button>
      </div>
    )
  }

  const canStart = wo.status === "Assigned" || wo.status === "Incomplete"
  const canProgress = wo.status === "InProgress"
  const busy = update.isPending

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={`Work order #${wo.id}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                WORK_ORDER_STATUS_META[wo.status].badge,
              )}
            >
              {WORK_ORDER_STATUS_META[wo.status].label}
            </span>
            <span className="text-xs">Tender #{wo.tenderId}</span>
          </span>
        }
      />

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Scope of work
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">
          {wo.scopeOfWork}
        </p>

        <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Row icon={Calendar03Icon} label="Start date">
            {wo.startDate ? formatDate(wo.startDate) : "Not started"}
          </Row>
          <Row icon={Calendar03Icon} label="End date">
            {wo.endDate ? formatDate(wo.endDate) : "—"}
          </Row>
        </dl>

        {wo.remarks && (
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Remarks
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{wo.remarks}</p>
          </div>
        )}

        {wo.completionProofUrl && (
          <a
            href={wo.completionProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            <HugeiconsIcon icon={File01Icon} size={15} />
            View completion proof
          </a>
        )}
      </div>

      {/* Actions */}
      {(canStart || canProgress) && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-6">
          <p className="mr-auto text-sm font-medium text-foreground">
            Update progress
          </p>
          {canStart && (
            <Button
              variant="brand"
              disabled={busy}
              onClick={() => setStatus("InProgress")}
            >
              <HugeiconsIcon icon={PlayIcon} />
              {wo.status === "Incomplete" ? "Resume work" : "Start work"}
            </Button>
          )}
          {canProgress && (
            <>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setStatus("Incomplete")}
              >
                <HugeiconsIcon icon={Wrench01Icon} />
                Report blocked
              </Button>
              <Button
                variant="brand"
                disabled={busy}
                onClick={() => setCompleteOpen(true)}
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} />
                Mark completed
              </Button>
            </>
          )}
        </div>
      )}

      <Dialog
        open={completeOpen}
        onOpenChange={(next) => {
          if (!next) setProof(null)
          setCompleteOpen(next)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark work order completed</DialogTitle>
            <DialogDescription>
              Upload proof of completion (a photo or document). The reviewing
              officer verifies it before closing the work order.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleComplete} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="proof">Completion proof</Label>
              <Input
                id="proof"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCompleteOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={busy}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} />
                {busy ? "Submitting…" : "Mark completed"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
