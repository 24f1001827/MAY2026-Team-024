"use client"

import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/components/shadcn/card"
import { Input } from "@/components/shadcn/input"
import { Textarea } from "@/components/shadcn/textarea"
import { NativeSelect } from "@/components/shadcn/native-select"
import { Label } from "@/components/shadcn/label"
import { ApiError } from "@/lib/api/api-client"
import { toast } from "@/lib/styles/toast-styles"
import { routes } from "@/nav"
import {
  useCreateDepartment,
  useUpdateDepartment,
} from "@/hooks/department"
import { useUsers } from "@/hooks/admin-users"
import type {
  CreateDepartmentRequest,
  Department,
  UpdateDepartmentRequest,
} from "@/types/department"

/** Shared `id` linking the header's submit button to this form. */
export const DEPARTMENT_FORM_ID = "department-form"

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

/**
 * Create/edit form for a department (admin-only, enforced by the page). Submits
 * through the departments API. The head-officer options come from the active
 * officers list (`/admin/users?role=Officer&status=Active`); the backend
 * validates that the chosen head is a real officer.
 */
export function DepartmentForm({
  mode,
  department,
}: {
  mode: "create" | "edit"
  department?: Department
}) {
  const router = useRouter()
  const isEdit = mode === "edit"

  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const pending = createDepartment.isPending || updateDepartment.isPending

  // Active officers are the eligible department heads.
  const { data: officers, isPending: officersLoading } = useUsers({
    role: "Officer",
    status: "Active",
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    const description = String(data.get("description") ?? "").trim()
    const headOfficerId = String(data.get("headOfficerId") ?? "")

    // Guard: a whitespace-only name trims to "" — don't send it.
    if (!name) {
      toast.error("Name is required", {
        description: "Enter a department name.",
      })
      return
    }

    const base: CreateDepartmentRequest = {
      name,
      description: description || undefined,
      // Empty string → null clears/omits the head.
      head_officer_id: headOfficerId || null,
    }

    const onError = (error: unknown) => {
      toast.error(isEdit ? "Couldn’t save changes" : "Couldn’t create department", {
        description:
          error instanceof ApiError || error instanceof Error
            ? error.message
            : "Please try again.",
      })
    }

    if (isEdit && department) {
      const input: UpdateDepartmentRequest = base
      updateDepartment.mutate(
        { id: department.id, input },
        {
          onSuccess: (updated) => {
            toast.success("Department updated", {
              description: "Your changes have been saved.",
            })
            router.push(routes.departments.detail(updated.id).href)
            router.refresh()
          },
          onError,
        },
      )
    } else {
      createDepartment.mutate(base, {
        onSuccess: () => {
          toast.success("Department created", {
            description: "The new department has been added.",
          })
          router.push(routes.departments.href)
          router.refresh()
        },
        onError,
      })
    }
  }

  return (
    <form id={DEPARTMENT_FORM_ID} onSubmit={handleSubmit}>
      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent className="space-y-5">
          <Field label="Name" htmlFor="name">
            <Input
              id="name"
              name="name"
              required
              defaultValue={department?.name}
              placeholder="e.g. Public Works"
            />
          </Field>

          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={department?.description}
              placeholder="What this department is responsible for"
            />
          </Field>

          <Field label="Department head" htmlFor="headOfficerId">
            <NativeSelect
              id="headOfficerId"
              name="headOfficerId"
              defaultValue={department?.headOfficerId ?? ""}
              disabled={officersLoading || (officers?.length ?? 0) === 0}
            >
              <option value="">No Head Assigned</option>
              {officers?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </NativeSelect>
            {!officersLoading && (officers?.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground">
                No active officers yet — approve an officer to assign a head.
              </p>
            )}
          </Field>
        </CardContent>
      </Card>
    </form>
  )
}
