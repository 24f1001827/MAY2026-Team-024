"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  InboxIcon,
  Megaphone01Icon,
  PencilEdit02Icon,
  Search01Icon,
  SentIcon,
  UserGroupIcon,
  UserStar01Icon,
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
import { NativeSelect } from "@/components/shadcn/native-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs"
import { Pagination } from "@/features/common/components/pagination"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/styles/toast-styles"
import { routes } from "@/nav"
import { formatCurrency } from "@/lib/utils/common/format"
import {
  PRIORITY_META,
  statusBadgeClass,
  statusLabel,
} from "@/lib/utils/complaint/display"
import {
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  type Complaint,
} from "@/types/complaint"
import { AVAILABILITY_STATUSES, type AvailabilityStatus } from "@/types/officer"
import type { Department } from "@/types/department"
import { PageHeader } from "@/features/common/components/page-header"

/** Page size for the dashboard's paginated tab lists. */
const TAB_PAGE_SIZE = 6

/** Search box + a single filter select, shared by the paginated tabs. */
function TabFilters({
  search,
  onSearchChange,
  searchPlaceholder,
  filter,
  onFilterChange,
  filterPlaceholder,
  options,
}: {
  search: string
  onSearchChange: (v: string) => void
  searchPlaceholder: string
  filter: string
  onFilterChange: (v: string) => void
  filterPlaceholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-xs">
        <HugeiconsIcon
          icon={Search01Icon}
          size={14}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-8 pl-8 text-sm"
        />
      </div>
      <Select value={filter} onValueChange={onFilterChange}>
        <SelectTrigger size="sm" className="w-40 text-xs">
          <SelectValue placeholder={filterPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** Count text + pager, shown under a paginated tab list. */
function TabFooter({
  startIndex,
  endIndex,
  total,
  noun,
  page,
  totalPages,
  onPageChange,
}: {
  startIndex: number
  endIndex: number
  total: number
  noun: string
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-3">
      <span className="text-sm text-muted-foreground">
        {total === 0 ? 0 : startIndex + 1}–{endIndex} of {total} {noun}
      </span>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  )
}

/** A department officer, flattened with their user's display name. */
export type DepartmentOfficer = {
  userId: string
  name: string
  availabilityStatus: AvailabilityStatus
  currentWorkload: number
  maxWorkload: number
  isHead: boolean
}

const AVAILABILITY_META: Record<
  AvailabilityStatus,
  { label: string; dot: string }
> = {
  Available: { label: "Available", dot: "bg-emerald-500" },
  Engaged: { label: "Engaged", dot: "bg-amber-500" },
  OnLeave: { label: "On leave", dot: "bg-muted-foreground" },
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: IconSvgElement
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand">
        <HugeiconsIcon icon={icon} size={16} />
      </span>
      <p className="mt-3 text-lg font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

/** A single complaint line with an optional right-hand action. */
function ComplaintItem({
  complaint,
  action,
}: {
  complaint: Complaint
  action?: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
          statusBadgeClass(complaint.status)
        )}
      >
        {statusLabel(complaint.status)}
      </span>
      <div className="min-w-0 flex-1">
        <Link
          href={routes.complaints.detail(complaint.id).href}
          className="line-clamp-1 text-sm font-medium text-foreground hover:text-brand"
        >
          {complaint.title}
        </Link>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span
              className={cn(
                "size-1.5 rounded-full",
                PRIORITY_META[complaint.priority].dot
              )}
            />
            {PRIORITY_META[complaint.priority].label}
          </span>
          {` · ${complaint.locality}, ${complaint.city}`}
        </p>
      </div>
      {action ?? (
        <Link
          href={routes.complaints.detail(complaint.id).href}
          className="shrink-0 text-muted-foreground transition-transform hover:translate-x-0.5 hover:text-brand"
          aria-label={`View ${complaint.title}`}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Link>
      )}
    </li>
  )
}

function OfficerWorkload({ officer }: { officer: DepartmentOfficer }) {
  return (
    <li className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          {officer.name}
          {officer.isHead && (
            <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
              Head
            </span>
          )}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span
            className={cn(
              "size-1.5 rounded-full",
              AVAILABILITY_META[officer.availabilityStatus].dot
            )}
          />
          {AVAILABILITY_META[officer.availabilityStatus].label}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand"
          style={{
            width: `${Math.min(
              100,
              (officer.currentWorkload / officer.maxWorkload) * 100
            )}%`,
          }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {officer.currentWorkload}/{officer.maxWorkload} cases
      </p>
    </li>
  )
}

/** Slice a filtered list for the current page. */
function paginate<T>(items: T[], page: number) {
  const totalPages = Math.ceil(items.length / TAB_PAGE_SIZE)
  const current = Math.min(page, totalPages || 1)
  const startIndex = (current - 1) * TAB_PAGE_SIZE
  const paged = items.slice(startIndex, startIndex + TAB_PAGE_SIZE)
  const endIndex = Math.min(startIndex + TAB_PAGE_SIZE, items.length)
  return { paged, current, totalPages, startIndex, endIndex }
}

function QueueTab({
  queue,
  manualAllotment,
  canAllotNow,
  officersCount,
  onAllot,
}: {
  queue: Complaint[]
  manualAllotment: boolean
  canAllotNow: boolean
  officersCount: number
  onAllot: (c: Complaint) => void
}) {
  const [search, setSearch] = useState("")
  const [priority, setPriority] = useState("all")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return queue.filter(
      (c) =>
        (c.title.toLowerCase().includes(q) ||
          c.locality.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)) &&
        (priority === "all" || c.priority === priority)
    )
  }, [queue, search, priority])

  const { paged, current, totalPages, startIndex, endIndex } = paginate(
    filtered,
    page
  )
  const onFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v)
    setPage(1)
  }

  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Unassigned queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!manualAllotment && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Automatic allotment is on — complaints are assigned to the
            least-loaded officer as they arrive.
          </p>
        )}
        <TabFilters
          search={search}
          onSearchChange={onFilter(setSearch)}
          searchPlaceholder="Search complaints…"
          filter={priority}
          onFilterChange={onFilter(setPriority)}
          filterPlaceholder="Priority"
          options={[
            { value: "all", label: "All priorities" },
            ...COMPLAINT_PRIORITIES.map((p) => ({
              value: p,
              label: PRIORITY_META[p].label,
            })),
          ]}
        />
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {queue.length === 0
              ? "Nothing waiting — every complaint has been allotted."
              : "No complaints match your filters."}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {paged.map((complaint) => (
                <ComplaintItem
                  key={complaint.id}
                  complaint={complaint}
                  action={
                    canAllotNow ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="brand"
                        disabled={officersCount === 0}
                        onClick={() => onAllot(complaint)}
                      >
                        Allot
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </ul>
            <TabFooter
              startIndex={startIndex}
              endIndex={endIndex}
              total={filtered.length}
              noun="complaints"
              page={current}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

function MyComplaintsTab({
  complaints,
  onAccept,
  onReject,
  actingId,
}: {
  complaints: Complaint[]
  /** Accept the pending assignment for a complaint (officer's own queue). */
  onAccept?: (complaintId: string) => void
  /** Reject the pending assignment for a complaint. */
  onReject?: (complaintId: string) => void
  /** Complaint id with an accept/reject request in flight (disables its row). */
  actingId?: string | null
}) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return complaints.filter(
      (c) =>
        (c.title.toLowerCase().includes(q) ||
          c.locality.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)) &&
        (status === "all" || c.status === status)
    )
  }, [complaints, search, status])

  const { paged, current, totalPages, startIndex, endIndex } = paginate(
    filtered,
    page
  )
  const onFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v)
    setPage(1)
  }

  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Assigned to me</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TabFilters
          search={search}
          onSearchChange={onFilter(setSearch)}
          searchPlaceholder="Search complaints…"
          filter={status}
          onFilterChange={onFilter(setStatus)}
          filterPlaceholder="Status"
          options={[
            { value: "all", label: "All statuses" },
            ...COMPLAINT_STATUSES.map((s) => ({
              value: s,
              label: statusLabel(s),
            })),
          ]}
        />
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {complaints.length === 0
              ? "Nothing assigned to you right now."
              : "No complaints match your filters."}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {paged.map((complaint) => {
                // A complaint still in "Assigned" is pending this officer's
                // acceptance — offer Accept / Reject.
                const pending =
                  complaint.status === "Assigned" &&
                  Boolean(onAccept) &&
                  Boolean(onReject)
                const busy = actingId === complaint.id
                return (
                  <ComplaintItem
                    key={complaint.id}
                    complaint={complaint}
                    action={
                      pending ? (
                        <span className="flex shrink-0 items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="brand"
                            disabled={busy}
                            onClick={() => onAccept?.(complaint.id)}
                          >
                            Accept
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            disabled={busy}
                            onClick={() => onReject?.(complaint.id)}
                          >
                            Reject
                          </Button>
                        </span>
                      ) : undefined
                    }
                  />
                )
              })}
            </ul>
            <TabFooter
              startIndex={startIndex}
              endIndex={endIndex}
              total={filtered.length}
              noun="complaints"
              page={current}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

function OfficersTab({
  officers,
  departmentName,
}: {
  officers: DepartmentOfficer[]
  departmentName: string
}) {
  const [search, setSearch] = useState("")
  const [availability, setAvailability] = useState("all")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return officers.filter(
      (o) =>
        o.name.toLowerCase().includes(q) &&
        (availability === "all" || o.availabilityStatus === availability)
    )
  }, [officers, search, availability])

  const { paged, current, totalPages, startIndex, endIndex } = paginate(
    filtered,
    page
  )
  const onFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v)
    setPage(1)
  }

  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Officers in {departmentName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TabFilters
          search={search}
          onSearchChange={onFilter(setSearch)}
          searchPlaceholder="Search officers…"
          filter={availability}
          onFilterChange={onFilter(setAvailability)}
          filterPlaceholder="Availability"
          options={[
            { value: "all", label: "All availability" },
            ...AVAILABILITY_STATUSES.map((s) => ({
              value: s,
              label: AVAILABILITY_META[s].label,
            })),
          ]}
        />
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {officers.length === 0
              ? "No officers in this department yet."
              : "No officers match your filters."}
          </p>
        ) : (
          <>
            <ul className="space-y-4">
              {paged.map((officer) => (
                <OfficerWorkload key={officer.userId} officer={officer} />
              ))}
            </ul>
            <TabFooter
              startIndex={startIndex}
              endIndex={endIndex}
              total={filtered.length}
              noun="officers"
              page={current}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function DepartmentDashboard({
  department,
  officers,
  queue: initialQueue,
  myComplaints,
  totalComplaints,
  manualAllotment,
  canManage,
  canAllot,
  showMyComplaints,
  onAllot,
  allotting = false,
  onAccept,
  onReject,
  actingId,
}: {
  department: Department
  /** All officers in the department. */
  officers: DepartmentOfficer[]
  /** Complaints not yet allotted to an officer. */
  queue: Complaint[]
  /** Complaints allotted to the signed-in officer (empty for admins). */
  myComplaints: Complaint[]
  /** Total complaints routed to this department (for the overview stat). */
  totalComplaints: number
  /** Global setting: when off, complaints are auto-assigned (no manual queue). */
  manualAllotment: boolean
  /** Admin — may edit the department record. */
  canManage: boolean
  /** Admin or the department head — may allot queued complaints. */
  canAllot: boolean
  /** The viewer is an officer, so show their personal "Complaints" tab. */
  showMyComplaints: boolean
  /**
   * Persist an allotment to the backend. Resolves on success (the dialog then
   * closes and the row leaves the queue). When omitted, allotment is local-only
   * (mock) — used by pages not yet wired to the API.
   */
  onAllot?: (complaintId: string, officerId: string) => Promise<void>
  /** True while an allotment request is in flight (disables the dialog). */
  allotting?: boolean
  /** Officer accepts their pending assignment (My Queue tab). */
  onAccept?: (complaintId: string) => void
  /** Officer rejects their pending assignment. */
  onReject?: (complaintId: string) => void
  /** Complaint id with an accept/reject in flight. */
  actingId?: string | null
}) {
  const [queue, setQueue] = useState<Complaint[]>(initialQueue)

  // Allotment dialog state.
  const [allotTarget, setAllotTarget] = useState<Complaint | null>(null)
  const [allotOfficerId, setAllotOfficerId] = useState<string>("")

  const officerName = useMemo(
    () => new Map(officers.map((o) => [o.userId, o.name])),
    [officers]
  )
  const head = officers.find((o) => o.isHead) ?? null
  const canAllotNow = canAllot && manualAllotment

  function openAllot(complaint: Complaint) {
    setAllotTarget(complaint)
    setAllotOfficerId(officers[0]?.userId ?? "")
  }

  async function handleAllot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!allotTarget || !allotOfficerId) return

    const target = allotTarget
    const officerLabel = officerName.get(allotOfficerId) ?? "officer"

    // With a backend handler, persist first and only update the UI on success.
    if (onAllot) {
      try {
        await onAllot(target.id, allotOfficerId)
      } catch (error) {
        toast.error("Couldn’t allot complaint", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        })
        return
      }
    }

    setQueue((prev) => prev.filter((c) => c.id !== target.id))
    toast.success("Complaint allotted", {
      description: `Assigned to ${officerLabel}.`,
    })
    setAllotTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
            title={department.name}
            description={department.description}
            actions={canManage ? (
              <Button asChild variant="outline">
                <Link href={routes.departments.detail(department.id).edit}>
                  <HugeiconsIcon icon={PencilEdit02Icon} />
                  Edit department
                </Link>
              </Button>
            ) : undefined
          }
      />

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queue">
            Unassigned Queue
            {queue.length > 0 && (
              <span className="ml-1 rounded-full bg-brand/10 px-1.5 text-[10px] font-semibold text-brand">
                {queue.length}
              </span>
            )}
          </TabsTrigger>
          {showMyComplaints && (
            <TabsTrigger value="mine">
              My Queue
              {myComplaints.length > 0 && (
                <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                  {myComplaints.length}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="officers">Officers</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------------- */}
        {/* Overview */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={Wallet01Icon}
              label={
                department.budget
                  ? `Budget · FY ${department.budget.financialYear}`
                  : "Budget"
              }
              value={
                department.budget
                  ? `${formatCurrency(
                      department.budget.allocated,
                    )} / ${formatCurrency(department.budget.total)}`
                  : "Not set"
              }
            />
            <Stat
              icon={Megaphone01Icon}
              label="Complaints"
              value={totalComplaints}
            />
            <Stat
              icon={UserGroupIcon}
              label="Officers"
              value={officers.length}
            />
            <Stat icon={InboxIcon} label="Unassigned" value={queue.length} />
          </div>

          <Card className="[--card-spacing:--spacing(6)]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Department Head
              </CardTitle>
            </CardHeader>
            <CardContent>
              {head ? (
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                    <HugeiconsIcon icon={UserStar01Icon} size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {head.name}
                    </p>
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          AVAILABILITY_META[head.availabilityStatus].dot
                        )}
                      />
                      {AVAILABILITY_META[head.availabilityStatus].label} ·{" "}
                      {head.currentWorkload}/{head.maxWorkload} cases
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No head assigned to this department yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Unassigned queue — all officers can see; admin/head can allot */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="queue" className="mt-6">
          <QueueTab
            queue={queue}
            manualAllotment={manualAllotment}
            canAllotNow={canAllotNow}
            officersCount={officers.length}
            onAllot={openAllot}
          />
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* My complaints — the viewer's own assignments */}
        {/* ---------------------------------------------------------------- */}
        {showMyComplaints && (
          <TabsContent value="mine" className="mt-6">
            <MyComplaintsTab
              complaints={myComplaints}
              onAccept={onAccept}
              onReject={onReject}
              actingId={actingId}
            />
          </TabsContent>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Officers */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="officers" className="mt-6">
          <OfficersTab officers={officers} departmentName={department.name} />
        </TabsContent>
      </Tabs>

      {/* Allot dialog */}
      <Dialog
        open={allotTarget !== null}
        onOpenChange={(open) => !open && setAllotTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allot complaint</DialogTitle>
            <DialogDescription>
              Assign “{allotTarget?.title}” to an officer in {department.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAllot} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="allotOfficer">Officer</Label>
              <NativeSelect
                id="allotOfficer"
                value={allotOfficerId}
                onChange={(e) => setAllotOfficerId(e.target.value)}
              >
                {officers.map((o) => (
                  <option key={o.userId} value={o.userId}>
                    {o.name} — {o.currentWorkload}/{o.maxWorkload} cases
                  </option>
                ))}
              </NativeSelect>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAllotTarget(null)}
                disabled={allotting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="brand"
                disabled={!allotOfficerId || allotting}
              >
                <HugeiconsIcon icon={SentIcon} />
                {allotting ? "Allotting…" : "Allot"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
