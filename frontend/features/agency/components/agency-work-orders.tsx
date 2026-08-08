"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, PackageIcon } from "@hugeicons/core-free-icons"

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
import { useAgencyWorkOrders } from "@/hooks/agency"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/common/format"
import { WORK_ORDER_STATUS_META } from "@/lib/utils/agency/display"
import { routes } from "@/nav"

const PAGE_SIZE = 10

/** Work orders awarded to the agency, paginated. */
export function AgencyWorkOrders() {
  const router = useRouter()
  const { data, isPending, isError, error, refetch } = useAgencyWorkOrders()

  const [page, setPage] = useState(1)

  const workOrders = useMemo(() => {
    const list = data ?? []
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [data])

  const totalPages = Math.max(1, Math.ceil(workOrders.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, workOrders.length)
  const rows = workOrders.slice(startIndex, endIndex)

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Work Orders"
        description="Awarded contracts to execute. Update progress and upload completion proof."
      />

      {isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <p className="text-sm font-medium text-destructive">
            Couldn’t load work orders.
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
                Loading work orders…
              </p>
            ) : rows.length === 0 ? (
              <Empty className="py-12">
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={PackageIcon} size={24} />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No work orders</EmptyTitle>
                  <EmptyDescription>
                    Work orders appear here once a proposal you submitted is
                    awarded.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Work order</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((w) => (
                    <TableRow
                      key={w.id}
                      className="group cursor-pointer"
                      onClick={() =>
                        router.push(routes.workOrders.detail(w.id).href)
                      }
                    >
                      <TableCell className="pl-5">
                        <Link
                          href={routes.workOrders.detail(w.id).href}
                          className="font-medium text-foreground group-hover:text-brand"
                          onClick={(e) => e.stopPropagation()}
                        >
                          WO #{w.id}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Tender #{w.tenderId}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-xs text-sm text-muted-foreground">
                        <span className="line-clamp-1">{w.scopeOfWork}</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                            WORK_ORDER_STATUS_META[w.status].badge,
                          )}
                        >
                          {WORK_ORDER_STATUS_META[w.status].label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(w.createdAt)}
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

          {workOrders.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {startIndex + 1}–{endIndex} of {workOrders.length}{" "}
                {workOrders.length === 1 ? "work order" : "work orders"}
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
