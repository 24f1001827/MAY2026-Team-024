"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  Link01Icon,
  LinkBackwardIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/shadcn/drawer"
import { Input } from "@/components/shadcn/input"
import { Label } from "@/components/shadcn/label"
import { NativeSelect } from "@/components/shadcn/native-select"
import { Spinner } from "@/components/shadcn/spinner"
import { Textarea } from "@/components/shadcn/textarea"
import {
  useAllComplaints,
  useClusterMembers,
  useDisputeCluster,
  useLinkCluster,
  useResolveDispute,
  useUnlinkCluster,
} from "@/hooks/complaint"
import { useDepartmentDashboard } from "@/hooks/officer"
import { ApiError } from "@/lib/api/api-client"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/styles/toast-styles"
import {
  formatShortDate,
  statusBadgeClass,
  statusLabel,
} from "@/lib/utils/complaint/display"
import { routes } from "@/nav"
import type { Complaint, DisputeOutcome } from "@/types/complaint"
import type { UserRole } from "@/types/user"

/** Minimum characters the backend requires on a dispute reason. */
const MIN_DISPUTE_REASON = 10

type IssueDrawerProps = {
  complaint: Complaint
  currentRole?: UserRole
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** One complaint row in the issue's member list. */
function MemberRow({
  member,
  isCurrent,
  canUnlink,
  onUnlink,
  pending,
  unlinking,
}: {
  member: Complaint
  isCurrent: boolean
  canUnlink: boolean
  onUnlink: () => void
  /** Any action is in flight — every row's button is disabled. */
  pending: boolean
  /** *This* row is the one being unlinked — it gets the spinner. */
  unlinking: boolean
}) {
  return (
    <li
      className={cn(
        "rounded-lg border p-3",
        isCurrent ? "border-brand bg-brand/5" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {member.isClusterPrimary && (
              <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand uppercase">
                Primary
              </span>
            )}
            {isCurrent && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                This one
              </span>
            )}
            {member.clusterDisputed && (
              <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-destructive uppercase">
                Disputed
              </span>
            )}
          </div>
          <Link
            href={routes.complaints.detail(member.id).href}
            className="mt-1 block truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            {member.title}
          </Link>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 font-medium ring-1 ring-inset",
                statusBadgeClass(member.status),
              )}
            >
              {statusLabel(member.status)}
            </span>
            <span>#{member.id.slice(0, 8)}</span>
            <span>{formatShortDate(member.createdAt)}</span>
          </p>
        </div>
        {canUnlink && !member.isClusterPrimary && (
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0"
            disabled={pending}
            onClick={onUnlink}
          >
            {unlinking ? (
              <>
                <Spinner className="size-3.5" />
                Unlinking…
              </>
            ) : (
              <>
                <HugeiconsIcon icon={LinkBackwardIcon} size={14} />
                Unlink
              </>
            )}
          </Button>
        )}
      </div>
    </li>
  )
}

/**
 * Right-side drawer holding everything about the issue a complaint belongs to:
 * the complaints linked to it, staff link/unlink controls, and the full dispute
 * exchange — the citizen's objection and the staff resolution — in one place.
 *
 * "Issue" is the real-world problem; the complaints under it are "linked
 * complaints". Neither is a "report", which in this product means the officer's
 * inspection report.
 */
export function IssueDrawer({
  complaint,
  currentRole,
  open,
  onOpenChange,
}: IssueDrawerProps) {
  const isStaff = currentRole === "Admin" || currentRole === "Officer"
  const isCitizen = currentRole === "Citizen"

  // Only fetches while the drawer is open.
  const { data: members, isPending } = useClusterMembers(open ? complaint.id : null)

  const disputeCluster = useDisputeCluster()
  const resolveDispute = useResolveDispute()
  const linkCluster = useLinkCluster()
  const unlinkCluster = useUnlinkCluster()
  const busy =
    disputeCluster.isPending ||
    resolveDispute.isPending ||
    linkCluster.isPending ||
    unlinkCluster.isPending

  // React Query exposes the in-flight arguments, so the spinner can land on the
  // exact row being acted on rather than blanking the whole list.
  const unlinkingId = unlinkCluster.isPending ? unlinkCluster.variables : null
  const linkingId = linkCluster.isPending
    ? linkCluster.variables?.targetComplaintId
    : null

  const [disputeReason, setDisputeReason] = useState("")
  const [resolutionOutcome, setResolutionOutcome] =
    useState<DisputeOutcome>("Upheld")
  const [resolutionNote, setResolutionNote] = useState("")
  const [linkQuery, setLinkQuery] = useState("")
  const [linkOpen, setLinkOpen] = useState(false)

  function fail(err: unknown, fallback: string) {
    toast.error(err instanceof ApiError ? err.message : fallback)
  }

  async function handleDispute() {
    if (disputeReason.trim().length < MIN_DISPUTE_REASON) {
      toast.error("Add a reason", {
        description: `Tell us why in at least ${MIN_DISPUTE_REASON} characters.`,
      })
      return
    }
    try {
      await disputeCluster.mutateAsync({
        id: complaint.id,
        reason: disputeReason.trim(),
      })
      setDisputeReason("")
      toast.success("Dispute raised", {
        description: "The handling officer has been notified.",
      })
    } catch (err) {
      fail(err, "Couldn’t raise the dispute.")
    }
  }

  async function handleResolve() {
    try {
      await resolveDispute.mutateAsync({
        id: complaint.id,
        outcome: resolutionOutcome,
        note: resolutionNote.trim() || undefined,
      })
      setResolutionNote("")
      toast.success(
        resolutionOutcome === "Upheld"
          ? "Dispute upheld — the complaint was split into its own issue."
          : "Dispute rejected — the complaint stays linked.",
      )
    } catch (err) {
      fail(err, "Couldn’t resolve the dispute.")
    }
  }

  async function handleUnlink(id: string) {
    try {
      await unlinkCluster.mutateAsync(id)
      toast.success("Complaint unlinked.")
    } catch (err) {
      fail(err, "Couldn’t unlink the complaint.")
    }
  }

  async function handleLink(targetComplaintId: string) {
    try {
      await linkCluster.mutateAsync({ id: complaint.id, targetComplaintId })
      setLinkOpen(false)
      setLinkQuery("")
      toast.success("Complaint linked to that issue.")
    } catch (err) {
      fail(err, "Couldn’t link the complaint.")
    }
  }

  const list = members ?? []
  const disputed = complaint.clusterDisputed
  const hasResolution = Boolean(complaint.disputeOutcome)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Issue</DrawerTitle>
          <DrawerDescription>
            {isPending
              ? "Loading Linked Complaints…"
              : `${list.length} complaint${list.length === 1 ? "" : "s"} reporting this issue.`}
          </DrawerDescription>
          {/* Announces the in-flight action; hidden (but still read out) when
              nothing is running, so the header doesn't jump around. */}
          <DrawerDescription
            aria-live="polite"
            className={busy ? "flex items-center gap-1.5 text-brand" : "sr-only"}
          >
            {busy ? (
              <>
                <Spinner className="size-3" />
                Updating this issue…
              </>
            ) : (
              ""
            )}
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          {/* Open dispute — the reason, and the staff resolution controls. */}
          {disputed && (
            <section className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-destructive uppercase">
                <HugeiconsIcon icon={Alert02Icon} size={14} />
                Dispute open
              </h3>
              {complaint.disputeReason && (
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  “{complaint.disputeReason}”
                </p>
              )}
              {complaint.disputeRaisedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Raised {formatShortDate(complaint.disputeRaisedAt)}
                </p>
              )}

              {isStaff && (
                <div className="mt-3 space-y-2 border-t border-destructive/20 pt-3">
                  <Label htmlFor="disputeOutcome" className="text-xs">
                    Resolution
                  </Label>
                  <NativeSelect
                    id="disputeOutcome"
                    value={resolutionOutcome}
                    onChange={(e) =>
                      setResolutionOutcome(e.target.value as DisputeOutcome)
                    }
                  >
                    <option value="Upheld">
                      Uphold — split into its own issue
                    </option>
                    <option value="Rejected">Reject — keep it linked</option>
                  </NativeSelect>
                  <Textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={2}
                    placeholder="Note for the reporter (optional)…"
                  />
                  <Button
                    size="sm"
                    variant="brand"
                    disabled={busy}
                    onClick={handleResolve}
                  >
                    {resolveDispute.isPending ? (
                      <>
                        <Spinner className="size-3.5" />
                        Resolving…
                      </>
                    ) : (
                      "Resolve dispute"
                    )}
                  </Button>
                </div>
              )}

              {isCitizen && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Staff will review your objection and either split this
                  complaint out or keep it linked.
                </p>
              )}
            </section>
          )}

          {/* Settled dispute — kept visible so the outcome stays accountable. */}
          {!disputed && hasResolution && (
            <section className="rounded-lg border border-border bg-muted/40 p-3">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
                Dispute {complaint.disputeOutcome?.toLowerCase()}
              </h3>
              {complaint.disputeReason && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  “{complaint.disputeReason}”
                </p>
              )}
              {complaint.disputeResolutionNote && (
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {complaint.disputeResolutionNote}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {complaint.disputeResolvedByName
                  ? `Resolved by ${complaint.disputeResolvedByName}`
                  : "Resolved"}
                {complaint.disputeResolvedAt &&
                  ` · ${formatShortDate(complaint.disputeResolvedAt)}`}
              </p>
            </section>
          )}

          {/* The linked complaints themselves. */}
          <section>
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Linked Complaints
            </h3>
            {isPending ? (
              <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
            ) : list.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                This complaint isn’t linked to any others.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {list.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    isCurrent={member.id === complaint.id}
                    canUnlink={isStaff}
                    pending={busy}
                    unlinking={unlinkingId === member.id}
                    onUnlink={() => handleUnlink(member.id)}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Staff: attach this complaint to a different issue. */}
          {isStaff && (
            <section>
              {linkOpen ? (
                <LinkPicker
                  currentRole={currentRole}
                  linkingId={linkingId}
                  excludeIds={list.map((member) => member.id)}
                  query={linkQuery}
                  onQueryChange={setLinkQuery}
                  onPick={handleLink}
                  onCancel={() => {
                    setLinkOpen(false)
                    setLinkQuery("")
                  }}
                  pending={busy}
                />
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={busy}
                  onClick={() => setLinkOpen(true)}
                >
                  <HugeiconsIcon icon={Link01Icon} size={14} />
                  Link this complaint to another issue
                </Button>
              )}
            </section>
          )}

          {/* Citizen: object to the link. */}
          {isCitizen && !disputed && list.length > 1 && (
            <section className="space-y-2 border-t pt-4">
              <Label htmlFor="disputeReason" className="text-xs">
                Not the same issue?
              </Label>
              <Textarea
                id="disputeReason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={3}
                placeholder="Explain why your complaint is a different issue…"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={handleDispute}
              >
                {disputeCluster.isPending ? (
                  <>
                    <Spinner className="size-3.5" />
                    Submitting…
                  </>
                ) : (
                  "Dispute this link"
                )}
              </Button>
            </section>
          )}
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

/**
 * Search-and-pick for the complaint whose issue this one should join. Replaces
 * the old `window.prompt` that expected a raw UUID to be pasted in.
 *
 * Admins search every complaint; officers search their department's, which is
 * also the only scope the backend will accept from them.
 */
function LinkPicker({
  currentRole,
  linkingId,
  excludeIds,
  query,
  onQueryChange,
  onPick,
  onCancel,
  pending,
}: {
  currentRole?: UserRole
  /** The complaint whose issue we're joining right now, if a link is running. */
  linkingId?: string | null
  excludeIds: string[]
  query: string
  onQueryChange: (value: string) => void
  onPick: (id: string) => void
  onCancel: () => void
  pending: boolean
}) {
  const isAdmin = currentRole === "Admin"
  // Each role reads only the list its own endpoint allows.
  const adminComplaints = useAllComplaints(isAdmin)
  const departmentDashboard = useDepartmentDashboard()

  const adminList = adminComplaints.data
  const departmentList = departmentDashboard.data?.complaints
  const loading = isAdmin
    ? adminComplaints.isPending
    : departmentDashboard.isPending

  // `excludeIds` is a fresh array each render, so memoize on its contents.
  const excludeKey = excludeIds.join(",")

  const results = useMemo(() => {
    const source: Complaint[] = isAdmin
      ? (adminList ?? [])
      : (departmentList ?? [])
    const needle = query.trim().toLowerCase()
    const excluded = new Set(excludeKey ? excludeKey.split(",") : [])
    return source
      .filter((item) => !excluded.has(item.id))
      .filter(
        (item) =>
          !needle ||
          item.title.toLowerCase().includes(needle) ||
          item.locality.toLowerCase().includes(needle) ||
          item.id.toLowerCase().startsWith(needle),
      )
      .slice(0, 8)
  }, [isAdmin, adminList, departmentList, query, excludeKey])

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <Label htmlFor="linkSearch" className="text-xs">
        Link to the issue of…
      </Label>
      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="linkSearch"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by title, locality or id…"
          className="pl-8"
          autoFocus
        />
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading complaints…</p>
      ) : results.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No matching complaint{query.trim() ? " — try another search" : ""}.
        </p>
      ) : (
        <ul className="space-y-1">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => onPick(item.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted disabled:opacity-50"
              >
                {linkingId === item.id && (
                  <Spinner className="size-3.5 shrink-0 text-brand" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">
                    {item.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {linkingId === item.id
                      ? "Linking…"
                      : `${item.locality} · #${item.id.slice(0, 8)}`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button size="sm" variant="ghost" onClick={onCancel} disabled={pending}>
        Cancel
      </Button>
    </div>
  )
}
