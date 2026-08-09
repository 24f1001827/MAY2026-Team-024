import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Mail01Icon,
  Note01Icon,
  PackageIcon,
  SmartPhone01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import { PageHeader } from "@/features/common/components/page-header"
import type { AgencyView } from "@/types/agency"

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

export function AgencyDetail({ agency }: { agency: AgencyView }) {
  const pct =
    agency.maxProjects > 0
      ? Math.min(
          100,
          Math.round((agency.currentProjects / agency.maxProjects) * 100),
        )
      : 0

  return (
    <>
      <PageHeader
        title={agency.name}
        description="Registered agency that bids on tenders and executes work orders."
      />

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
    </>
  )
}
