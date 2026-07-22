import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Building03Icon,
  Mail01Icon,
  PencilEdit02Icon,
  SmartPhone01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { cn } from "@/lib/utils"
import { routes } from "@/nav"
import { AVAILABILITY_META } from "@/lib/utils/officer/display"
import type { OfficerView } from "./officer-list"

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

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

export function OfficerDetail({ officer }: { officer: OfficerView }) {
  const pct =
    officer.maxWorkload > 0
      ? Math.min(100, Math.round((officer.currentWorkload / officer.maxWorkload) * 100))
      : 0

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
            {initialsOf(officer.name) || "O"}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {officer.name}
            </h1>
            <span
              className={cn(
                "mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                AVAILABILITY_META[officer.availabilityStatus].badge
              )}
            >
              {AVAILABILITY_META[officer.availabilityStatus].label}
            </span>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={routes.officers.detail(officer.userId).edit}>
            <HugeiconsIcon icon={PencilEdit02Icon} />
            Edit officer
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Row icon={Mail01Icon} label="Email">
            {officer.email}
          </Row>
          <Row icon={SmartPhone01Icon} label="Phone">
            {officer.phone}
          </Row>
          <Row icon={Building03Icon} label="Department">
            {officer.departmentName}
          </Row>
          <Row icon={Task01Icon} label="Workload">
            {officer.currentWorkload} of {officer.maxWorkload} cases
          </Row>
        </dl>

        <div className="mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {pct}% of capacity in use
          </p>
        </div>
      </div>
    </div>
  )
}
