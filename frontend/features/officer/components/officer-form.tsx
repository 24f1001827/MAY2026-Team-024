"use client"

import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/components/shadcn/card"
import { Input } from "@/components/shadcn/input"
import { NativeSelect } from "@/components/shadcn/native-select"
import { Label } from "@/components/shadcn/label"
import { toast } from "@/lib/styles/toast-styles"
import { routes } from "@/nav"
import { mockDepartments } from "@/components/shared/mock-data"
import { AVAILABILITY_STATUSES } from "@/types/officer"
import type { AvailabilityStatus, CreateOfficerRequest } from "@/types/officer"
import type { OfficerView } from "./officer-list"

/** Shared `id` linking the header's submit button to this form. */
export const OFFICER_FORM_ID = "officer-form"

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

export function OfficerForm({
  mode,
  officer,
}: {
  mode: "create" | "edit"
  officer?: OfficerView & { departmentId?: number }
}) {
  const router = useRouter()
  const isEdit = mode === "edit"

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Collect the form into a typed payload, ready to POST/PATCH once the
    // backend lands. Native `required` + input types handle basic validation.
    const data = new FormData(event.currentTarget)
    const input: CreateOfficerRequest = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      departmentId: Number(data.get("departmentId") ?? 0),
      availabilityStatus: String(
        data.get("availabilityStatus") ?? "Available"
      ) as AvailabilityStatus,
      maxWorkload: Number(data.get("maxWorkload") ?? 0),
    }

    if (isEdit && officer) {
      // TODO(backend): PATCH officers/:userId with { userId: officer.userId, ...input } (UpdateOfficerInput).
      toast.success("Officer updated", {
        description: `Your changes to ${input.name} have been saved.`,
      })
      router.push(routes.officers.detail(officer.userId).href)
    } else {
      // TODO(backend): POST officers with `input` (CreateOfficerInput).
      toast.success("Officer added", {
        description: `${input.name} has been onboarded.`,
      })
      router.push(routes.officers.href)
    }
  }

  return (
    <form id={OFFICER_FORM_ID} onSubmit={handleSubmit}>
      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent className="space-y-5">
          <Field label="Full name" htmlFor="name">
            <Input
              id="name"
              name="name"
              required
              defaultValue={officer?.name}
              placeholder="Officer name"
            />
          </Field>

          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={officer?.email}
              placeholder="officer@rastro.gov"
            />
          </Field>

          <Field label="Phone" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={officer?.phone}
              placeholder="+91 98000 00000"
            />
          </Field>

          <Field label="Department" htmlFor="departmentId">
            <NativeSelect
              id="departmentId"
              name="departmentId"
              required
              defaultValue={officer?.departmentId ?? ""}
            >
              <option value="" disabled>
                Select a department
              </option>
              {mockDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Availability" htmlFor="availabilityStatus">
            <NativeSelect
              id="availabilityStatus"
              name="availabilityStatus"
              defaultValue={officer?.availabilityStatus ?? "Available"}
            >
              {AVAILABILITY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Max workload (cases)" htmlFor="maxWorkload">
            <Input
              id="maxWorkload"
              name="maxWorkload"
              type="number"
              min={1}
              required
              defaultValue={officer?.maxWorkload ?? 8}
            />
          </Field>
        </CardContent>
      </Card>
    </form>
  )
}
