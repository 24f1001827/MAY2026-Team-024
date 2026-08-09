"use client"

import { useState } from "react"
import { notFound, useRouter } from "next/navigation"

import { Button } from "@/components/shadcn/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog"
import { ApiError } from "@/lib/api/api-client"
import {
  DepartmentDashboard,
  type DepartmentOfficer,
} from "@/features/department/components/department-dashboard"
import {
  useAdminAllotComplaint,
  useDeleteDepartment,
  useDepartmentDashboard,
} from "@/hooks/department"
import { getApiErrorMessage } from "@/lib/api/error-message"
import { toast } from "@/lib/styles/toast-styles"
import { routes } from "@/nav"
import type { Complaint } from "@/types/complaint"

/**
 * Admin per-department dashboard: loads a specific department's dashboard by id
 * and renders it with live allotment via the admin assign endpoint. Admins can
 * allot, edit the record, and delete the department.
 */
export function AdminDepartmentDashboardView({ id }: { id: number }) {
  const router = useRouter()
  const { data, isPending, isError, error } = useDepartmentDashboard(id)
  const allot = useAdminAllotComplaint(id)
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
        {error instanceof Error ? error.message : "Couldn’t load the department."}
      </div>
    )
  }

  const departmentName = data.department.name

  function handleDelete() {
    if (deleteDepartment.isPending) return

    deleteDepartment.mutate(id, {
      onSuccess: () => {
        toast.success("Department deleted", {
          description: `${departmentName} has been removed.`,
        })
        setConfirmOpen(false)
        router.push(routes.departments.href)
        router.refresh()
      },
      onError: (err) => {
        toast.error("Couldn’t delete department", {
          description: getApiErrorMessage(err, "Please try again."),
        })
      },
    })
  }

  const officers: DepartmentOfficer[] = data.officers.map((o) => ({
    userId: o.userId,
    name: o.name,
    availabilityStatus: o.availabilityStatus,
    currentWorkload: o.currentWorkload,
    maxWorkload: o.maxWorkload,
    isHead: o.isHead,
  }))

  const queue: Complaint[] = data.complaints.filter(
    (c) => c.assignedOfficerId === null,
  )

  return (
    <>
      <DepartmentDashboard
        department={data.department}
        officers={officers}
        queue={queue}
        myComplaints={[]}
        totalComplaints={data.complaints.length}
        manualAllotment={data.manualAllotment}
        canManage
        canAllot
        showMyComplaints={false}
        onAllot={async (complaintId, officerId) => {
          await allot.mutateAsync({ complaintId, officerId })
        }}
        allotting={allot.isPending}
        onDelete={() => setConfirmOpen(true)}
        deleting={deleteDepartment.isPending}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete department</DialogTitle>
            <DialogDescription>
              Delete “{departmentName}”? This can’t be undone from here.
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
    </>
  )
}
