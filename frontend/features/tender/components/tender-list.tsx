import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, PlusSignIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table"
import { cn } from "@/lib/utils"
import { routes } from "@/nav"
import { formatCurrency, formatDate } from "@/lib/utils/common/format"
import { TENDER_STATUS_META } from "@/lib/utils/tender/display"
import type { TenderStatus } from "@/types/tender"

export interface TenderView {
  id: number
  complaintId: string
  complaintTitle: string
  title: string
  description: string
  estimatedCost: number
  closingDate: string
  status: TenderStatus
  createdByName: string
}

export function TenderList({
  tenders,
  canManage,
}: {
  tenders: TenderView[]
  canManage: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tenders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Work orders published against complaints for agencies to bid on.
          </p>
        </div>
        {canManage && (
          <Button asChild variant="brand">
            <Link href={routes.tenders.create}>
              <HugeiconsIcon icon={PlusSignIcon} />
              New tender
            </Link>
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tender</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Est. cost</TableHead>
              <TableHead>Closes</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenders.map((tender) => (
              <TableRow key={tender.id}>
                <TableCell>
                  <Link
                    href={routes.tenders.detail(tender.id).href}
                    className="font-medium text-foreground hover:text-brand"
                  >
                    {tender.title}
                  </Link>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {tender.complaintTitle}
                  </p>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                      TENDER_STATUS_META[tender.status].badge
                    )}
                  >
                    {TENDER_STATUS_META[tender.status].label}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatCurrency(tender.estimatedCost)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(tender.closingDate)}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={routes.tenders.detail(tender.id).href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand"
                    aria-label={`View ${tender.title}`}
                  >
                    View
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
