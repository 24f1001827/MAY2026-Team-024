import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Building06Icon,
  Mail01Icon,
  Note01Icon,
  PackageIcon,
  PencilEdit02Icon,
  SmartPhone01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { routes } from "@/nav"
import type { AgencyView } from "./agency-list"

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

export function AgencyDetail({
  agency,
  canManage,
}: {
  agency: AgencyView
  canManage: boolean
}) {
  const pct =
    agency.maxProjects > 0
      ? Math.min(100, Math.round((agency.currentProjects / agency.maxProjects) * 100))
      : 0

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <HugeiconsIcon icon={Building06Icon} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {agency.name}
            </h1>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {initialsOf(agency.name)} · Agency
            </p>
          </div>
        </div>
        {canManage && (
          <Button asChild variant="outline">
            <Link href={routes.agencies.detail(agency.id).edit}>
              <HugeiconsIcon icon={PencilEdit02Icon} />
              Edit agency
            </Link>
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Row icon={UserIcon} label="Contact person">
            {agency.contactPerson}
          </Row>
          <Row icon={Mail01Icon} label="Email">
            {agency.email}
          </Row>
          <Row icon={SmartPhone01Icon} label="Phone">
            {agency.phone}
          </Row>
          <Row icon={Note01Icon} label="Registration no.">
            {agency.registrationNumber}
          </Row>
          <Row icon={Note01Icon} label="License no.">
            {agency.licenseNumber}
          </Row>
          <Row icon={PackageIcon} label="Projects">
            {agency.currentProjects} of {agency.maxProjects} active
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
            {pct}% of project capacity in use
          </p>
        </div>
      </div>
    </div>
  )
}
