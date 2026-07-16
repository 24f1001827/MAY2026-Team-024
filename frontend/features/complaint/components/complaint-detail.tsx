"use client"

import { useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building03Icon,
  Calendar03Icon,
  Location01Icon,
  PencilEdit02Icon,
  SentIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { Textarea } from "@/components/shadcn/textarea"
import { NativeSelect } from "@/components/shadcn/native-select"
import { Label } from "@/components/shadcn/label"
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

  // Admins & citizens can edit the whole complaint; admins, officers, and
  // agencies can post remarks and move the status.
  const canEdit = currentRole === "Admin" || currentRole === "Citizen"
  const canManage =
    currentRole === "Admin" ||
    currentRole === "Officer" ||
    currentRole === "Agency"

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
      message:
        trimmed || `Status moved to ${statusLabel(nextStatus)}.`,
      statusFrom: statusChanged ? status : null,
      statusTo: statusChanged ? nextStatus : null,
      createdAt: new Date().toISOString(),
    }

    setRemarks((prev) => [remark, ...prev])
    if (statusChanged) setStatus(nextStatus)
    setMessage("")
    toast.success(statusChanged ? "Status updated" : "Remark added", {
      description: statusChanged
        ? `Complaint moved to ${statusLabel(nextStatus)}.`
        : "Your remark has been posted.",
    })
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                statusBadgeClass(status)
              )}
            >
              {statusLabel(status)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  PRIORITY_META[complaint.priority].dot
                )}
              />
              {PRIORITY_META[complaint.priority].label} priority
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {complaint.title}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            #{complaint.id.slice(0, 8)}
          </p>
        </div>

        {canEdit && (
          <Button asChild variant="outline">
            <Link href={routes.complaints.detail(complaint.id).edit}>
              <HugeiconsIcon icon={PencilEdit02Icon} />
              Edit complaint
            </Link>
          </Button>
        )}
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm leading-relaxed text-foreground">
          {complaint.description}
        </p>

        <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <DetailRow icon={Building03Icon} label="Department">
            {departmentName}
          </DetailRow>
          <DetailRow icon={UserIcon} label="Reported by">
            {citizenName}
          </DetailRow>
          <DetailRow icon={Location01Icon} label="Location">
            {complaint.address}, {complaint.locality}, {complaint.city},{" "}
            {complaint.state} {complaint.pincode}
          </DetailRow>
          <DetailRow icon={Calendar03Icon} label="Reported on">
            {formatShortDate(complaint.createdAt)}
          </DetailRow>
          {complaint.aiCategory && (
            <DetailRow icon={Building03Icon} label="Category">
              {complaint.aiCategory}
            </DetailRow>
          )}
        </dl>
      </div>

      {/* Activity */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Activity</h2>

        {canManage && (
          <form onSubmit={handlePostUpdate} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-[220px_1fr] sm:items-start">
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
                  rows={2}
                  placeholder="Add a note about this complaint…"
                />
              </div>
            </div>
            <Button type="submit" variant="brand">
              <HugeiconsIcon icon={SentIcon} />
              Post update
            </Button>
          </form>
        )}

        <ol className={cn("space-y-4", canManage && "mt-6 border-t border-border pt-6")}>
          {remarks.length === 0 ? (
            <li className="text-sm text-muted-foreground">No activity yet.</li>
          ) : (
            remarks.map((remark) => (
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
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: typeof Building03Icon
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
