"use client"

import Link from "next/link"
import { notFound } from "next/navigation"

import { ApiError } from "@/lib/api/api-client"
import { Button } from "@/components/shadcn/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table"
import { AgencyDetail } from "@/features/agency/components/agency-detail"
import type { AgencyView } from "@/features/agency/components/agency-list"
import {
  useAdminAgency,
  useAdminAgencyWorkOrders,
} from "@/hooks/admin-agencies"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/common/format"
import { WORK_ORDER_STATUS_META } from "@/lib/utils/agency/display"
import { routes } from "@/nav"

/** Admin agency detail (read-only) backed by `GET /admin/agencies/{id}`. */
export function AdminAgencyDetailView({ id }: { id: string }) {
  const { data, isPending, isError, error } = useAdminAgency(id)

  if (isError && error instanceof ApiError && error.isNotFound) notFound()

  if (isPending) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading agency…
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
        <p className="text-sm font-medium text-destructive">
          Couldn’t load this agency.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {error instanceof Error ? error.message : "Please try again."}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href={routes.agencies.href}>Back to agencies</Link>
        </Button>
      </div>
    )
  }

  const view: AgencyView = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    registrationNumber: data.registrationNumber,
    licenseNumber: data.licenseNumber,
    contactPerson: data.contactPerson,
    currentProjects: data.currentProjects,
    maxProjects: data.maxProjects,
  }

  return (
    <div className="space-y-6">
      <AgencyDetail agency={view} canManage={false} />
      <div className="mx-auto w-full max-w-3xl">
        <AgencyWorkOrdersSection id={id} />
      </div>
    </div>
  )
}

/** The work orders this agency is executing — its actual workload. */
function AgencyWorkOrdersSection({ id }: { id: string }) {
  const { data, isPending, isError } = useAdminAgencyWorkOrders(id)
  const workOrders = data ?? []

  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Work being done</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isPending ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Loading work orders…
          </p>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-destructive">
            Couldn’t load work orders.
          </p>
        ) : workOrders.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No work orders assigned to this agency.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Work order</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="pl-5">
                    <span className="font-medium text-foreground">
                      WO #{w.id}
                    </span>
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
                    {w.startDate ? formatDate(w.startDate) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
