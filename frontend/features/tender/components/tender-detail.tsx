import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Calendar03Icon,
  Megaphone01Icon,
  PencilEdit02Icon,
  UserIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { cn } from "@/lib/utils"
import { routes } from "@/nav"
import { formatCurrency, formatDate } from "@/lib/utils/common/format"
import { TENDER_STATUS_META } from "@/lib/utils/tender/display"
import type { TenderView } from "./tender-list"

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

export function TenderDetail({
  tender,
  canManage,
}: {
  tender: TenderView
  canManage: boolean
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
              TENDER_STATUS_META[tender.status].badge
            )}
          >
            {TENDER_STATUS_META[tender.status].label}
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {tender.title}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Tender #{tender.id}
          </p>
        </div>
        {canManage && (
          <Button asChild variant="outline">
            <Link href={routes.tenders.detail(tender.id).edit}>
              <HugeiconsIcon icon={PencilEdit02Icon} />
              Edit tender
            </Link>
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm leading-relaxed text-foreground">
          {tender.description}
        </p>

        <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Row icon={Wallet01Icon} label="Estimated cost">
            {formatCurrency(tender.estimatedCost)}
          </Row>
          <Row icon={Calendar03Icon} label="Closing date">
            {formatDate(tender.closingDate)}
          </Row>
          <Row icon={UserIcon} label="Created by">
            {tender.createdByName}
          </Row>
        </dl>
      </div>

      <Link
        href={routes.complaints.detail(tender.complaintId).href}
        className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
          <HugeiconsIcon icon={Megaphone01Icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Linked complaint
          </p>
          <p className="line-clamp-1 text-sm font-medium text-foreground group-hover:text-brand">
            {tender.complaintTitle}
          </p>
        </div>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={16}
          className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
        />
      </Link>
    </div>
  )
}
