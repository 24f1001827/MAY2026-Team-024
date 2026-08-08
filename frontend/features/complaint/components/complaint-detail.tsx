"use client"

import { useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Analytics01Icon,
  Building03Icon,
  ClipboardIcon,
  Clock01Icon,
  FlagIcon,
  Location01Icon,
  PencilEdit02Icon,
  PlusSignIcon,
  SparklesIcon,
  UserIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import {
  Card,
  CardAction,
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
import { Label } from "@/components/shadcn/label"
import { Textarea } from "@/components/shadcn/textarea"
import { PageHeader } from "@/features/common/components/page-header"
import { OfficerTenderSection } from "@/features/tender/components/officer-tender-section"
import { ComplaintLifecycleActions } from "@/features/complaint/components/complaint-lifecycle-actions"
import { useAddRemark } from "@/hooks/complaint"
import { ApiError } from "@/lib/api/api-client"
import { cn } from "@/lib/utils"
import { routes } from "@/nav"
import { toast } from "@/lib/styles/toast-styles"
import { formatCurrency } from "@/lib/utils/common/format"
import {
  PRIORITY_META,
  formatShortDate,
  statusBadgeClass,
  statusLabel,
} from "@/lib/utils/complaint/display"
import type { Complaint, ComplaintRemark } from "@/types/complaint"
import type { ReviewReport } from "@/types/officer"
import type { ComplaintTenderSummary } from "@/types/tender"
import type { UserRole } from "@/types/user"

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

type ComplaintDetailProps = {
  complaint: Complaint
  citizenName: string
  departmentName: string
  currentRole?: UserRole
  currentUserId?: string
  currentUserName?: string
  initialRemarks: ComplaintRemark[]
  /** Uploaded complaint photo URLs, shown as a gallery. */
  images?: string[]
  /** The complaint's tender (officer view), or null if none published yet. */
  tender?: ComplaintTenderSummary | null
  /** The officer's review report, shown to everyone viewing the complaint. */
  reviewReport?: ReviewReport | null
  /**
   * Public read-only view: forces off every edit/manage affordance regardless
   * of role. Pair with `citizenName="Anonymous"` on public surfaces.
   */
  readOnly?: boolean
}

export function ComplaintDetail({
  complaint,
  citizenName,
  departmentName,
  currentRole,
  currentUserId,
  initialRemarks,
  images = [],
  tender = null,
  reviewReport = null,
  readOnly = false,
}: ComplaintDetailProps) {
  // Only the citizen owner edits the whole complaint; admins oversee (no
  // create/edit). A read-only (public) view disables it regardless of role.
  const canEdit = !readOnly && currentRole === "Citizen"

  // Officers and admins can add remarks to the timeline.
  const canAddRemark =
    !readOnly && (currentRole === "Officer" || currentRole === "Admin")

  // The status + activity timeline are authoritative from the backend; lifecycle
  // transitions happen through `ComplaintLifecycleActions` (which refetches).
  const status = complaint.status

  const [remarkOpen, setRemarkOpen] = useState(false)
  const [remarkMessage, setRemarkMessage] = useState("")
  const addRemark = useAddRemark()

  // Newest first, regardless of the source ordering.
  const activity = [...initialRemarks].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )

  async function handleAddRemark(e: React.FormEvent) {
    e.preventDefault()
    if (remarkMessage.trim().length < 2) {
      toast.error("Enter a remark.")
      return
    }
    try {
      await addRemark.mutateAsync({
        id: complaint.id,
        message: remarkMessage.trim(),
      })
      toast.success("Activity added.")
      setRemarkMessage("")
      setRemarkOpen(false)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn’t add the remark.",
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={complaint.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                statusBadgeClass(status)
              )}
            >
              {statusLabel(status)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  PRIORITY_META[complaint.priority].dot
                )}
              />
              {PRIORITY_META[complaint.priority].label} priority
            </span>
            <span className="text-xs">#{complaint.id.slice(0, 8)}</span>
          </span>
        }
        actions={
          canEdit && (
            <Button asChild variant="outline">
              <Link href={routes.complaints.detail(complaint.id).edit}>
                <HugeiconsIcon icon={PencilEdit02Icon} />
                Edit complaint
              </Link>
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Details */}
          <Card className="[--card-spacing:--spacing(6)]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm leading-relaxed text-foreground">
                {complaint.description}
              </p>

              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <DetailRow icon={Building03Icon} label="Department">
                  {departmentName}
                </DetailRow>
                <DetailRow icon={FlagIcon} label="Priority">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        PRIORITY_META[complaint.priority].dot
                      )}
                    />
                    {PRIORITY_META[complaint.priority].label}
                  </span>
                </DetailRow>
                <DetailRow icon={SparklesIcon} label="AI category">
                  {complaint.aiCategory ?? (
                    <span className="text-muted-foreground">Not classified</span>
                  )}
                </DetailRow>
                <DetailRow icon={Analytics01Icon} label="AI priority score">
                  {complaint.aiPriorityScore ?? (
                    <span className="text-muted-foreground">Not scored</span>
                  )}
                </DetailRow>
                {complaint.allocatedBudget != null && (
                  <DetailRow icon={Wallet01Icon} label="Allocated budget">
                    {formatCurrency(complaint.allocatedBudget)}
                    {complaint.budgetYear && (
                      <span className="text-muted-foreground">
                        {" "}
                        · FY {complaint.budgetYear}
                      </span>
                    )}
                  </DetailRow>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Officer's review report — visible to anyone viewing the complaint. */}
          {reviewReport && (
            <Card className="[--card-spacing:--spacing(6)]">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Review report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-foreground">
                  {reviewReport.findings}
                </p>
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  <DetailRow icon={ClipboardIcon} label="Decision">
                    {reviewReport.decision}
                  </DetailRow>
                  <DetailRow icon={Clock01Icon} label="Reviewed">
                    {reviewReport.reviewDate
                      ? formatShortDate(reviewReport.reviewDate)
                      : "—"}
                  </DetailRow>
                  {reviewReport.estimatedCost != null && (
                    <DetailRow icon={Wallet01Icon} label="Estimated cost">
                      {formatCurrency(reviewReport.estimatedCost)}
                    </DetailRow>
                  )}
                  {reviewReport.estimatedDurationDays != null && (
                    <DetailRow icon={Clock01Icon} label="Estimated duration">
                      {reviewReport.estimatedDurationDays} days
                    </DetailRow>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Uploaded photos */}
          {images.length > 0 && (
            <Card className="[--card-spacing:--spacing(6)]">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((src, i) => (
                    <a
                      key={src}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Complaint photo ${i + 1}`}
                        loading="lazy"
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity history */}
          <Card className="[--card-spacing:--spacing(6)]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Activity History
              </CardTitle>
              {canAddRemark && (
                <CardAction>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setRemarkOpen(true)}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} />
                    Add activity
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              <ol className="space-y-5">
                {activity.length === 0 ? (
                  <li className="text-sm text-muted-foreground">
                    No activity yet.
                  </li>
                ) : (
                  activity.map((remark) => (
                    <li key={remark.id} className="flex gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {initialsOf(remark.authorName) || "U"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-sm font-medium text-foreground">
                            {remark.authorName}
                          </span>
                          {remark.authorRole && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {remark.authorRole}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatShortDate(remark.createdAt)}
                          </span>
                        </div>
                        {remark.statusFrom && remark.statusTo && (
                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="rounded-full bg-muted px-1.5 py-0.5 font-medium">
                              {statusLabel(remark.statusFrom)}
                            </span>
                            →
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 font-semibold ring-1 ring-inset",
                                statusBadgeClass(remark.statusTo)
                              )}
                            >
                              {statusLabel(remark.statusTo)}
                            </span>
                          </p>
                        )}
                        <p className="mt-1 text-sm leading-relaxed text-foreground">
                          {remark.message}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Role- and status-gated lifecycle actions (renders nothing when
              the current user has no applicable action). */}
          <ComplaintLifecycleActions
            complaint={complaint}
            currentRole={currentRole}
            currentUserId={currentUserId}
          />

          <InfoCard icon={Location01Icon} title="Location">
            <p className="text-sm leading-relaxed text-foreground">
              {complaint.address}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {complaint.locality}, {complaint.city}
              <br />
              {complaint.district}, {complaint.state} {complaint.pincode}
            </p>
          </InfoCard>

          <InfoCard icon={UserIcon} title="Reported by">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
                {initialsOf(citizenName) || "U"}
              </span>
              <span className="text-sm font-medium text-foreground">
                {citizenName}
              </span>
            </div>
          </InfoCard>

          <InfoCard icon={Clock01Icon} title="Reported on">
            <p className="text-sm text-foreground">
              {formatShortDate(complaint.createdAt)}
            </p>
            {complaint.updatedAt !== complaint.createdAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                Updated {formatShortDate(complaint.updatedAt)}
              </p>
            )}
          </InfoCard>

          {/* Tender workflow — officers publish a tender and review proposals. */}
          {!readOnly && currentRole === "Officer" && (
            <OfficerTenderSection
              complaintId={complaint.id}
              complaintTitle={complaint.title}
              complaintStatus={complaint.status}
              tender={tender}
            />
          )}
        </div>
      </div>

      {/* Add-activity (remark) dialog — officers and admins. */}
      <Dialog
        open={remarkOpen}
        onOpenChange={(open) => {
          if (!open) setRemarkMessage("")
          setRemarkOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add activity</DialogTitle>
            <DialogDescription>
              Add a remark to this complaint’s activity timeline.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRemark} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="activityMsg">Remark</Label>
              <Textarea
                id="activityMsg"
                value={remarkMessage}
                onChange={(e) => setRemarkMessage(e.target.value)}
                rows={3}
                placeholder="Add a note about this complaint…"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRemarkOpen(false)}
                disabled={addRemark.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={addRemark.isPending}>
                {addRemark.isPending ? "Adding…" : "Add activity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailRow({
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
      <div className="min-w-0">
        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
      </div>
    </div>
  )
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: IconSvgElement
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="[--card-spacing:--spacing(5)]">
      <CardContent>
        <div className="mb-3 flex items-center gap-2 text-muted-foreground">
          <HugeiconsIcon icon={icon} size={16} />
          <h2 className="text-xs font-medium tracking-wide uppercase">
            {title}
          </h2>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}
