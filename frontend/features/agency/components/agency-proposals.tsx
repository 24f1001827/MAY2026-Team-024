"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { DocumentAttachmentIcon, File01Icon } from "@hugeicons/core-free-icons"

import { Card, CardContent } from "@/components/shadcn/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shadcn/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table"
import { PageHeader } from "@/features/common/components/page-header"
import { Pagination } from "@/features/common/components/pagination"
import { useAgencyProposals } from "@/hooks/agency"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils/common/format"
import { PROPOSAL_STATUS_META } from "@/lib/utils/agency/display"
import { routes } from "@/nav"

const PAGE_SIZE = 10

/** The agency's submitted proposals, newest first, paginated. */
export function AgencyProposals() {
  const { data, isPending, isError, error, refetch } = useAgencyProposals()

  const [page, setPage] = useState(1)

  const proposals = useMemo(() => {
    const list = data ?? []
    return [...list].sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    )
  }, [data])

  const totalPages = Math.max(1, Math.ceil(proposals.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, proposals.length)
  const rows = proposals.slice(startIndex, endIndex)

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="My Proposals"
        description="Bids you’ve submitted on tenders and their current status."
      />

      {isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <p className="text-sm font-medium text-destructive">
            Couldn’t load proposals.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Please try again."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 text-xs font-medium text-brand underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <Card className="gap-0 overflow-hidden pb-0">
          <CardContent className="p-0">
            {isPending ? (
              <p className="p-10 text-center text-sm text-muted-foreground">
                Loading proposals…
              </p>
            ) : rows.length === 0 ? (
              <Empty className="py-12">
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={DocumentAttachmentIcon} size={24} />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No proposals yet</EmptyTitle>
                  <EmptyDescription>
                    Browse open tenders and submit your first proposal.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Tender</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Document</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p) => (
                    <TableRow key={p.proposalId}>
                      <TableCell className="pl-5">
                        <Link
                          href={routes.tenders.detail(p.tenderId).href}
                          className="font-medium text-foreground hover:text-brand"
                        >
                          Tender #{p.tenderId}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {formatCurrency(p.proposalAmount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                            PROPOSAL_STATUS_META[p.status].badge,
                          )}
                        >
                          {PROPOSAL_STATUS_META[p.status].label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.createdAt ? formatDate(p.createdAt) : "—"}
                      </TableCell>
                      <TableCell>
                        {p.proposalDocument ? (
                          <a
                            href={p.proposalDocument}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                          >
                            <HugeiconsIcon icon={File01Icon} size={14} />
                            View
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {proposals.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {startIndex + 1}–{endIndex} of {proposals.length}{" "}
                {proposals.length === 1 ? "proposal" : "proposals"}
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
