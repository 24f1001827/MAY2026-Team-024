"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Agreement02Icon,
  ArrowRight01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"

import { Card, CardContent, CardHeader } from "@/components/shadcn/card"
import { Input } from "@/components/shadcn/input"
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
import { useOpenTenders } from "@/hooks/agency"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils/common/format"
import { createResetPage } from "@/lib/utils/common/pagination"
import { TENDER_STATUS_META } from "@/lib/utils/tender/display"
import { routes } from "@/nav"

const PAGE_SIZE = 10

/**
 * Open tenders an agency can bid on. Read-only list with search + pagination;
 * each row links to the tender detail where a proposal can be submitted.
 */
export function AgencyTenders() {
  const router = useRouter()
  const { data, isPending, isError, error, refetch } = useOpenTenders()

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  // Any filter change returns to the first page.
  const resetPage = createResetPage(setPage)

  const tenders = useMemo(() => data ?? [], [data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tenders.filter((t) => t.title.toLowerCase().includes(q))
  }, [tenders, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, filtered.length)
  const rows = filtered.slice(startIndex, endIndex)

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Open Tenders"
        description="Published work orders you can bid on. Submit a proposal before the closing date."
      />

      {isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <p className="text-sm font-medium text-destructive">
            Couldn’t load tenders.
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
          <CardHeader className="border-b border-border pb-4">
            <div className="relative w-full sm:max-w-xs">
              <HugeiconsIcon
                icon={Search01Icon}
                size={14}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(e) => resetPage(setSearch)(e.target.value)}
                placeholder="Search tenders…"
                className="h-8 pl-8 text-sm"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isPending ? (
              <p className="p-10 text-center text-sm text-muted-foreground">
                Loading tenders…
              </p>
            ) : rows.length === 0 ? (
              <Empty className="py-12">
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={Agreement02Icon} size={24} />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No Open Tenders</EmptyTitle>
                  <EmptyDescription>
                    {tenders.length === 0
                      ? "There are no open tenders right now. Check back later."
                      : "Try adjusting your search."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Tender</TableHead>
                    <TableHead>Estimated cost</TableHead>
                    <TableHead>Closing date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((t) => (
                    <TableRow
                      key={t.id}
                      className="group cursor-pointer"
                      onClick={() =>
                        router.push(routes.tenders.detail(t.id).href)
                      }
                    >
                      <TableCell className="pl-5">
                        <Link
                          href={routes.tenders.detail(t.id).href}
                          className="font-medium text-foreground group-hover:text-brand"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Tender #{t.id}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {formatCurrency(t.estimatedCost)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(t.closingDate)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                            TENDER_STATUS_META[t.status].badge,
                          )}
                        >
                          {TENDER_STATUS_META[t.status].label}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={16}
                          className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {startIndex + 1}–{endIndex} of {filtered.length}{" "}
                {filtered.length === 1 ? "tender" : "tenders"}
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
