"use client"

import { useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Analytics01Icon,
  Building03Icon,
  Clock01Icon,
  FlagIcon,
  Location01Icon,
  PencilEdit02Icon,
  PlusSignIcon,
  SentIcon,
  SparklesIcon,
  UserIcon,
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
import { Textarea } from "@/components/shadcn/textarea"
import { NativeSelect } from "@/components/shadcn/native-select"
import { Label } from "@/components/shadcn/label"
import { PageHeader } from "@/features/common/components/page-header"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/styles/toast-styles"
import { routes } from "@/nav"
import {
  PRIORITY_META,
  formatShortDate,
  statusBadgeClass,
  statusLabel,
} from "@/lib/utils/complaint/display"
import {
  COMPLAINT_STATUSES,
  type Complaint,
  type ComplaintRemark,
  type ComplaintStatus,
} from "@/types/complaint"
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
  currentRole: UserRole
  currentUserId: string
  currentUserName: string
  initialRemarks: ComplaintRemark[]
}

export function ComplaintDetail({
  complaint,
  citizenName,
  departmentName,
  currentRole,
  currentUserId,
  currentUserName,
  initialRemarks,
}: ComplaintDetailProps) {
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status)
  const [remarks, setRemarks] = useState<ComplaintRemark[]>(initialRemarks)
  const [nextStatus, setNextStatus] = useState<ComplaintStatus>(complaint.status)
  const [message, setMessage] = useState("")
  const [postOpen, setPostOpen] = useState(false)

  // Admins & citizens can edit the whole complaint; admins, officers, and
  // agencies can post activity (remarks + status moves).
  const canEdit = currentRole === "Admin" || currentRole === "Citizen"
  const canManage =
    currentRole === "Admin" ||
    currentRole === "Officer" ||
    currentRole === "Agency"

  // Newest first, regardless of the source ordering.
  const activity = [...remarks].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )

  function handlePostUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const statusChanged = nextStatus !== status
    const trimmed = message.trim()

    if (!trimmed && !statusChanged) {
      toast.error("Nothing to post", {
        description: "Add a remark or change the status.",
      })
      return
    }

    const remark: ComplaintRemark = {
      id: crypto.randomUUID(),
      complaintId: complaint.id,
      authorId: currentUserId,
      authorName: currentUserName,
      authorRole: currentRole,
      message: trimmed || `Status moved to ${statusLabel(nextStatus)}.`,
      statusFrom: statusChanged ? status : null,
      statusTo: statusChanged ? nextStatus : null,
      createdAt: new Date().toISOString(),
    }

    setRemarks((prev) => [remark, ...prev])
    if (statusChanged) setStatus(nextStatus)
    setMessage("")
    setPostOpen(false)
    toast.success(statusChanged ? "Status updated" : "Activity posted", {
      description: statusChanged
        ? `Complaint moved to ${statusLabel(nextStatus)}.`
        : "Your remark has been added to the history.",
    })
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
              </dl>
            </CardContent>
          </Card>

          {/* Activity history */}
          <Card className="[--card-spacing:--spacing(6)]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Activity History
              </CardTitle>
              {canManage && (
                <CardAction>
                  <Button
                    type="button"
                    size="sm"
                    variant="brand"
                    onClick={() => setPostOpen(true)}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} />
                    New activity
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
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {remark.authorRole}
                          </span>
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
        </div>
      </div>

      {/* Post-activity dialog */}
      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post activity</DialogTitle>
            <DialogDescription>
              Add a remark and/or move this complaint&apos;s status.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePostUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nextStatus">Status</Label>
              <NativeSelect
                id="nextStatus"
                value={nextStatus}
                onChange={(e) =>
                  setNextStatus(e.target.value as ComplaintStatus)
                }
              >
                {COMPLAINT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="remark">Remark</Label>
              <Textarea
                id="remark"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Add a note about this complaint…"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPostOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand">
                <HugeiconsIcon icon={SentIcon} />
                Post activity
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
