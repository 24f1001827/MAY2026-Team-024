"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Agreement02Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  File01Icon,
  PackageIcon,
  PlusSignIcon,
  StarIcon,
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
import { Input } from "@/components/shadcn/input"
import { Label } from "@/components/shadcn/label"
import { Textarea } from "@/components/shadcn/textarea"
import {
  useCreateTender,
  useCreateWorkOrder,
  useMarkWorkOrderIncomplete,
  useTenderProposals,
  useUpdateProposalStatus,
  useVerifyWorkOrder,
} from "@/hooks/officer"
import { complaintKeys } from "@/hooks/complaint/keys"
import { ApiError } from "@/lib/api/api-client"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils/common/format"
import {
  PROPOSAL_STATUS_META,
  WORK_ORDER_STATUS_META,
} from "@/lib/utils/agency/display"
import { TENDER_STATUS_META } from "@/lib/utils/tender/display"
import { toast } from "@/lib/styles/toast-styles"
import type { ProposalStatus } from "@/types/agency"
import type { ComplaintStatus } from "@/types/complaint"
import type { ComplaintTenderSummary } from "@/types/tender"

/** Prefer the agency's real name; fall back to a short id label. */
function agencyLabel(name: string | null, agencyId: string): string {
  return name?.trim() || `Agency ${agencyId.slice(0, 8)}`
}

/**
 * Officer-only tender workflow embedded in a complaint's detail: publish a
 * tender for the complaint, then review the proposals it attracts — shortlist /
 * accept / reject bids and award a work order to the winner.
 */
export function OfficerTenderSection({
  complaintId,
  complaintTitle,
  complaintStatus,
  tender,
}: {
  complaintId: string
  complaintTitle: string
  complaintStatus: ComplaintStatus
  tender: ComplaintTenderSummary | null
}) {
  // A tender exists → review its proposals. Otherwise the officer can only
  // publish one once budget has been allocated (the backend enforces this),
  // so hide the section entirely until then to avoid a dead-end / 400.
  if (tender) {
    return <TenderProposalsCard complaintId={complaintId} tender={tender} />
  }
  if (complaintStatus === "BudgetAllocated") {
    return (
      <CreateTenderCard
        complaintId={complaintId}
        complaintTitle={complaintTitle}
      />
    )
  }
  return null
}

function CreateTenderCard({
  complaintId,
  complaintTitle,
}: {
  complaintId: string
  complaintTitle: string
}) {
  const create = useCreateTender()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(complaintTitle)
  const [description, setDescription] = useState("")
  const [closingDate, setClosingDate] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !closingDate) {
      toast.error("Title and closing date are required.")
      return
    }
    try {
      await create.mutateAsync({
        complaintId,
        title: title.trim(),
        description: description.trim() || undefined,
        closingDate: new Date(closingDate).toISOString(),
      })
      toast.success("Tender published.")
      setOpen(false)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t publish the tender.",
      )
    }
  }

  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Tender</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-6 text-center">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <HugeiconsIcon icon={Agreement02Icon} size={20} />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              No tender published
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Publish a tender to invite agencies to bid on this work.
            </p>
          </div>
          <Button variant="brand" onClick={() => setOpen(true)}>
            <HugeiconsIcon icon={PlusSignIcon} />
            Publish tender
          </Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish tender</DialogTitle>
            <DialogDescription>
              Invite agencies to bid on the work for this complaint.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tenderTitle">Title</Label>
              <Input
                id="tenderTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Road resurfacing — MG Road"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tenderDescription">Description (optional)</Label>
              <Textarea
                id="tenderDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Scope, materials, or constraints for bidders…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closingDate">Closing date</Label>
              <Input
                id="closingDate"
                type="datetime-local"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={create.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={create.isPending}>
                <HugeiconsIcon icon={Agreement02Icon} />
                {create.isPending ? "Publishing…" : "Publish tender"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function TenderProposalsCard({
  complaintId,
  tender,
}: {
  complaintId: string
  tender: ComplaintTenderSummary
}) {
  const qc = useQueryClient()
  const { data, isPending, isError, error, refetch } = useTenderProposals(
    tender.id,
  )
  const updateStatus = useUpdateProposalStatus(tender.id)
  const award = useCreateWorkOrder(tender.id)
  const verify = useVerifyWorkOrder(complaintId)
  const markIncomplete = useMarkWorkOrderIncomplete(complaintId)

  const [awardTarget, setAwardTarget] = useState<number | null>(null)
  const [scope, setScope] = useState("")
  const [remarks, setRemarks] = useState("")
  const [incompleteOpen, setIncompleteOpen] = useState(false)
  const [incompleteRemarks, setIncompleteRemarks] = useState("")

  const workOrder = tender.workOrder
  const proposals = data ?? []
  const busyId = updateStatus.isPending
    ? updateStatus.variables?.proposalId
    : undefined

  async function setStatus(proposalId: number, status: ProposalStatus) {
    try {
      await updateStatus.mutateAsync({ proposalId, status })
      toast.success(`Proposal ${status.toLowerCase()}.`)
      // Accepting a bid moves the tender toward Awarded — refresh the complaint
      // so its tender summary badge stays in sync.
      qc.invalidateQueries({ queryKey: complaintKeys.detail(complaintId) })
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t update the proposal.",
      )
    }
  }

  async function handleAward(e: React.FormEvent) {
    e.preventDefault()
    if (awardTarget == null) return
    if (scope.trim().length < 10) {
      toast.error("Scope of work must be at least 10 characters.")
      return
    }
    try {
      await award.mutateAsync({
        proposalId: awardTarget,
        scopeOfWork: scope.trim(),
        remarks: remarks.trim() || undefined,
      })
      toast.success("Work order awarded.")
      setAwardTarget(null)
      setScope("")
      setRemarks("")
      qc.invalidateQueries({ queryKey: complaintKeys.detail(complaintId) })
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t award the work order.",
      )
    }
  }

  function handleVerify() {
    if (!workOrder) return
    verify.mutate(workOrder.id, {
      onSuccess: () => toast.success("Work order verified — complaint resolved."),
      onError: (err) =>
        toast.error(
          err instanceof ApiError
            ? err.message
            : "Couldn’t verify the work order.",
        ),
    })
  }

  async function handleMarkIncomplete(e: React.FormEvent) {
    e.preventDefault()
    if (!workOrder) return
    if (incompleteRemarks.trim().length < 10) {
      toast.error("Remarks must be at least 10 characters.")
      return
    }
    markIncomplete.mutate(
      { workOrderId: workOrder.id, remarks: incompleteRemarks.trim() },
      {
        onSuccess: () => {
          toast.success("Sent back to the agency as incomplete.")
          setIncompleteOpen(false)
          setIncompleteRemarks("")
        },
        onError: (err) =>
          toast.error(
            err instanceof ApiError
              ? err.message
              : "Couldn’t update the work order.",
          ),
      },
    )
  }

  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Tender</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Tender summary */}
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">{tender.title}</p>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                TENDER_STATUS_META[tender.status].badge,
              )}
            >
              {TENDER_STATUS_META[tender.status].label}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={Wallet01Icon} size={14} />
              {formatCurrency(tender.estimatedCost)}
            </span>
            {tender.closingDate && (
              <span className="inline-flex items-center gap-1.5">
                <HugeiconsIcon icon={Calendar03Icon} size={14} />
                Closes {formatDate(tender.closingDate)}
              </span>
            )}
          </div>
        </div>

        {/* Awarded work order */}
        {workOrder && (
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">
                Work order #{workOrder.id}
              </p>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                  WORK_ORDER_STATUS_META[workOrder.status].badge,
                )}
              >
                {WORK_ORDER_STATUS_META[workOrder.status].label}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
              {workOrder.scopeOfWork}
            </p>
            {workOrder.completionProofUrl && (
              <a
                href={workOrder.completionProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
              >
                <HugeiconsIcon icon={File01Icon} size={13} />
                Completion proof
              </a>
            )}
            {(workOrder.status === "Completed" ||
              workOrder.status === "Verified") && (
              <div className="mt-3 flex flex-wrap gap-2">
                {workOrder.status === "Completed" && (
                  <Button
                    size="sm"
                    variant="brand"
                    disabled={verify.isPending || markIncomplete.isPending}
                    onClick={handleVerify}
                  >
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                    Verify & resolve
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={verify.isPending || markIncomplete.isPending}
                  onClick={() => setIncompleteOpen(true)}
                >
                  Mark incomplete
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Proposals */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Proposals
          </p>
          {isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-sm text-destructive">
              {error instanceof Error ? error.message : "Couldn’t load proposals."}
              <button
                type="button"
                onClick={() => refetch()}
                className="ml-2 font-medium underline-offset-2 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : isPending ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Loading proposals…
            </p>
          ) : proposals.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
              No proposals submitted yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {proposals.map((p) => {
                const rowBusy = busyId === p.proposalId || award.isPending
                return (
                  <li
                    key={p.proposalId}
                    className="rounded-xl border border-border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {agencyLabel(p.agencyName, p.agencyId)}
                        </p>
                        {p.contactPerson && (
                          <p className="text-xs text-muted-foreground">
                            {p.contactPerson}
                          </p>
                        )}
                        <p className="mt-0.5 text-lg font-semibold text-foreground">
                          {formatCurrency(p.proposalAmount)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                          PROPOSAL_STATUS_META[p.status].badge,
                        )}
                      >
                        {PROPOSAL_STATUS_META[p.status].label}
                      </span>
                    </div>

                    {p.remarks && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {p.remarks}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {p.proposalDocument && (
                        <a
                          href={p.proposalDocument}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-auto inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                        >
                          <HugeiconsIcon icon={File01Icon} size={14} />
                          Document
                        </a>
                      )}

                      {p.status === "Submitted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={rowBusy}
                          onClick={() => setStatus(p.proposalId, "Shortlisted")}
                        >
                          <HugeiconsIcon icon={StarIcon} size={14} />
                          Shortlist
                        </Button>
                      )}
                      {(p.status === "Submitted" ||
                        p.status === "Shortlisted") && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={rowBusy}
                            onClick={() => setStatus(p.proposalId, "Rejected")}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="brand"
                            disabled={rowBusy}
                            onClick={() => setStatus(p.proposalId, "Accepted")}
                          >
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                            Accept
                          </Button>
                        </>
                      )}
                      {p.status === "Accepted" && (
                        <Button
                          size="sm"
                          variant="brand"
                          disabled={rowBusy}
                          onClick={() => setAwardTarget(p.proposalId)}
                        >
                          <HugeiconsIcon icon={PackageIcon} size={14} />
                          Award work order
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </CardContent>

      <Dialog
        open={awardTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAwardTarget(null)
            setScope("")
            setRemarks("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award work order</DialogTitle>
            <DialogDescription>
              Create the work order the winning agency will execute. Define the
              scope of work clearly.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAward} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="scope">Scope of work</Label>
              <Textarea
                id="scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                rows={4}
                placeholder="Describe what the agency must deliver…"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="awardRemarks">Remarks (optional)</Label>
              <Textarea
                id="awardRemarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="Any additional instructions…"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAwardTarget(null)}
                disabled={award.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={award.isPending}>
                <HugeiconsIcon icon={PackageIcon} />
                {award.isPending ? "Awarding…" : "Award work order"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={incompleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIncompleteOpen(false)
            setIncompleteRemarks("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark work order incomplete</DialogTitle>
            <DialogDescription>
              Send the work back to the agency with a note on what’s missing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMarkIncomplete} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="incompleteRemarks">Remarks</Label>
              <Textarea
                id="incompleteRemarks"
                value={incompleteRemarks}
                onChange={(e) => setIncompleteRemarks(e.target.value)}
                rows={3}
                placeholder="What still needs to be done…"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIncompleteOpen(false)}
                disabled={markIncomplete.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="brand"
                disabled={markIncomplete.isPending}
              >
                {markIncomplete.isPending ? "Sending…" : "Mark incomplete"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
