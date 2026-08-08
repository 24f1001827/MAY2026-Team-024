"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  Calendar03Icon,
  File01Icon,
  SentIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
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
import { Skeleton } from "@/components/shadcn/skeleton"
import {
  useAgencyProposals,
  useAgencyTender,
  useSubmitProposal,
} from "@/hooks/agency"
import { ApiError } from "@/lib/api/api-client"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils/common/format"
import { PROPOSAL_STATUS_META } from "@/lib/utils/agency/display"
import { TENDER_STATUS_META } from "@/lib/utils/tender/display"
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

export function AgencyTenderDetail({ id }: { id: number }) {
  const tenderQuery = useAgencyTender(id)
  const proposalsQuery = useAgencyProposals()
  const submit = useSubmitProposal()

  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [remarks, setRemarks] = useState("")
  const [file, setFile] = useState<File | null>(null)

  // Has this agency already bid on this tender?
  const existingProposal = useMemo(
    () => (proposalsQuery.data ?? []).find((p) => p.tenderId === id) ?? null,
    [proposalsQuery.data, id],
  )

  const tender = tenderQuery.data

  function resetForm() {
    setAmount("")
    setRemarks("")
    setFile(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast.error("A proposal document is required.")
      return
    }
    const numeric = Number(amount)
    if (!Number.isFinite(numeric) || numeric <= 0) {
      toast.error("Enter a valid proposal amount.")
      return
    }
    try {
      await submit.mutateAsync({
        tenderId: id,
        proposalAmount: numeric,
        remarks: remarks.trim() || undefined,
        document: file,
      })
      toast.success("Proposal submitted.")
      setOpen(false)
      resetForm()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t submit the proposal.",
      )
    }
  }

  if (tenderQuery.isPending) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (tenderQuery.isError || !tender) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
        <p className="text-sm font-medium text-destructive">
          Couldn’t load this tender.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {tenderQuery.error instanceof Error
            ? tenderQuery.error.message
            : "It may have been closed or removed."}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={routes.tenders.href}>Back to tenders</Link>
        </Button>
      </div>
    )
  }

  const canBid = tender.status === "Open" && !existingProposal

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href={routes.tenders.href}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
          All tenders
        </Link>
      </Button>

      <div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
            TENDER_STATUS_META[tender.status].badge,
          )}
        >
          {TENDER_STATUS_META[tender.status].label}
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          {tender.title}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">Tender #{tender.id}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm leading-relaxed text-foreground">
          {tender.description || "No description provided."}
        </p>
        <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Row icon={Wallet01Icon} label="Estimated cost">
            {formatCurrency(tender.estimatedCost)}
          </Row>
          <Row icon={Calendar03Icon} label="Closing date">
            {formatDate(tender.closingDate)}
          </Row>
        </dl>
      </div>

      {/* Proposal state / action */}
      {existingProposal ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your proposal
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {formatCurrency(existingProposal.proposalAmount)}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                PROPOSAL_STATUS_META[existingProposal.status].badge,
              )}
            >
              {PROPOSAL_STATUS_META[existingProposal.status].label}
            </span>
          </div>
          {existingProposal.remarks && (
            <p className="mt-3 text-sm text-muted-foreground">
              {existingProposal.remarks}
            </p>
          )}
          {existingProposal.proposalDocument && (
            <a
              href={existingProposal.proposalDocument}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              <HugeiconsIcon icon={File01Icon} size={15} />
              View submitted document
            </a>
          )}
        </div>
      ) : canBid ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <p className="text-sm font-medium text-foreground">
              Interested in this work?
            </p>
            <p className="text-xs text-muted-foreground">
              Submit a proposal with your quote and supporting document.
            </p>
          </div>
          <Button variant="brand" onClick={() => setOpen(true)}>
            <HugeiconsIcon icon={SentIcon} />
            Submit proposal
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          This tender is {TENDER_STATUS_META[tender.status].label.toLowerCase()}{" "}
          and is no longer accepting proposals.
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) resetForm()
          setOpen(next)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit proposal</DialogTitle>
            <DialogDescription>
              Bid on “{tender.title}”. Your quote and document are shared with
              the reviewing officer.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Proposal amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2500000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="remarks">Remarks (optional)</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Approach, timeline, or notes for the officer…"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="document">Proposal document</Label>
              <Input
                id="document"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Attach your detailed proposal or quotation.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submit.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={submit.isPending}>
                <HugeiconsIcon icon={SentIcon} />
                {submit.isPending ? "Submitting…" : "Submit proposal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
