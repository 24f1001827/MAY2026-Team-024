"use client"

import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/components/shadcn/card"
import { Input } from "@/components/shadcn/input"
import { Textarea } from "@/components/shadcn/textarea"
import { NativeSelect } from "@/components/shadcn/native-select"
import { Label } from "@/components/shadcn/label"
import { toast } from "@/lib/styles/toast-styles"
import { routes } from "@/nav"
import type { Department } from "@/types/department"

/** An officer eligible to head this department. */
export type DepartmentHeadOption = { userId: string; name: string }

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
 * Create/edit form for a department. Admin-only (enforced by the page).
 * Mock-only — submits toast + redirect until the backend lands. Title and the
 * Cancel/submit actions live in the page's PageHeader.
 */
export function DepartmentForm({
  mode,
  department,
  officers = [],
}: {
  mode: "create" | "edit"
  department?: Department
  /** Officers in this department, eligible to be its head. */
  officers?: DepartmentHeadOption[]
}) {
  const router = useRouter()
  const isEdit = mode === "edit"

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // TODO: wire to the departments API.
    if (isEdit && department) {
      toast.success("Department updated", {
        description: "Your changes have been saved.",
      })
      router.push(routes.departments.detail(department.id).href)
    } else {
      toast.success("Department created", {
        description: "The new department has been added.",
      })
      router.push(routes.departments.href)
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
              required
              rows={3}
              defaultValue={department?.description}
              placeholder="What this department is responsible for"
            />
          </Field>

          <Field label="Annual budget (₹)" htmlFor="budget">
            <Input
              id="budget"
              name="budget"
              type="number"
              min={0}
              required
              defaultValue={department?.budget}
              placeholder="25000000"
            />
          </Field>

          <Field label="Department head" htmlFor="headOfficerId">
            <NativeSelect
              id="headOfficerId"
              name="headOfficerId"
              defaultValue={department?.headOfficerId ?? ""}
              disabled={officers.length === 0}
            >
              <option value="">No Head Assigned</option>
              {officers.map((o) => (
                <option key={o.userId} value={o.userId}>
                  {o.name}
                </option>
              ))}
            </NativeSelect>
            {officers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Add officers to this department first to assign a head.
              </p>
            )}
          </Field>
        </CardContent>
      </Card>
    </form>
  )
}
