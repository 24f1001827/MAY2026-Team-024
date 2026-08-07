"use client"

import { useState } from "react"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Calendar03Icon,
  Delete02Icon,
  PencilEdit02Icon,
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
import { ApiError } from "@/lib/api/api-client"
import { formatCurrency } from "@/lib/utils/common/format"
import { toast } from "@/lib/styles/toast-styles"
import { routes } from "@/nav"
import { useDeleteDepartment, useDepartment } from "@/hooks/department"

function Stat({
  icon,
  label,
  value,
}: {
  icon: IconSvgElement
  label: string
  value: string
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

function formatDate(iso: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
}

/**
 * Admin department profile — the record fields the backend exposes plus
 * edit/delete. The officer/complaint/queue dashboard returns once those modules
 * are integrated.
 */
export function DepartmentProfile({ id }: { id: number }) {
  const router = useRouter()
  const { data: department, isPending, isError, error } = useDepartment(id)
  const deleteDepartment = useDeleteDepartment()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (isError && error instanceof ApiError && error.isNotFound) notFound()

  if (isPending) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading department…
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center text-sm text-destructive">
        {error instanceof Error ? error.message : "Couldn’t load this department."}
      </div>
    )
  }

  function handleDelete() {
    if (!department || deleteDepartment.isPending) return
    const name = department.name
    deleteDepartment.mutate(id, {
      onSuccess: () => {
        toast.success("Department deleted", {
          description: `${name} has been removed.`,
        })
        router.push(routes.departments.href)
        router.refresh()
      },
      onError: (err) => {
        toast.error("Couldn’t delete department", {
          description:
            err instanceof ApiError || err instanceof Error
              ? err.message
              : "Please try again.",
        })
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {department.name}
          </h1>
          {department.description && (
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {department.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline">
            <Link href={routes.departments.detail(department.id).edit}>
              <HugeiconsIcon icon={PencilEdit02Icon} />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={Wallet01Icon}
          label="Annual Budget"
          value={formatCurrency(department.budget)}
        />
        <Stat
          icon={Calendar03Icon}
          label="Created"
          value={formatDate(department.createdAt)}
        />
        <Stat
          icon={Calendar03Icon}
          label="Last updated"
          value={formatDate(department.updatedAt)}
        />
      </div>

      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Department Head</CardTitle>
        </CardHeader>
        <CardContent>
          {department.headOfficerName ? (
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                <HugeiconsIcon icon={UserStar01Icon} size={18} />
              </span>
              <p className="text-sm font-medium text-foreground">
                {department.headOfficerName}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No head assigned to this department yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete department</DialogTitle>
            <DialogDescription>
              Delete “{department.name}”? This can’t be undone from here.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleteDepartment.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDepartment.isPending}
            >
              {deleteDepartment.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
