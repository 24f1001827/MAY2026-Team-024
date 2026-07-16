"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card"
import { Input } from "@/components/shadcn/input"
import { Textarea } from "@/components/shadcn/textarea"
import { NativeSelect } from "@/components/shadcn/native-select"
import { Label } from "@/components/shadcn/label"
import { mockDepartments } from "@/components/shared/mock-data"
import { toast } from "@/lib/styles/toast-styles"
import { routes } from "@/nav"
import { COMPLAINT_PRIORITIES, type Complaint } from "@/types/complaint"
import { LocationPicker } from "./location-picker"
import { IndiaIssueLocationForm } from "./india-issue-location-form"

/** Shared `id` linking the header's submit button to this form. */
export const COMPLAINT_FORM_ID = "complaint-form"

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
 * Full create/edit form for a complaint. Only admins and citizens reach this
 * (enforced by the page); officers/agencies update via remarks on the detail
 * page. Mock-only — submits toast + redirect until the backend lands. Title and
 * the Cancel/submit actions live in the page's PageHeader.
 */
export function ComplaintForm({
  mode,
  complaint,
}: {
  mode: "create" | "edit"
  complaint?: Complaint
}) {
  const router = useRouter()
  const isEdit = mode === "edit"

  const [coords, setCoords] = useState<{
    lat: number | null
    lng: number | null
  }>({
    lat: complaint?.latitude ?? null,
    lng: complaint?.longitude ?? null,
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // TODO: wire to the complaints API.
    if (isEdit && complaint) {
      toast.success("Complaint updated", {
        description: "Your changes have been saved.",
      })
      router.push(routes.complaints.detail(complaint.id).href)
    } else {
      toast.success("Complaint filed", {
        description: "Your complaint has been submitted for review.",
      })
      router.push(routes.complaints.href)
    }
  }

  return (
    <form
      id={COMPLAINT_FORM_ID}
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-3 lg:items-start"
    >
      {/* Main details — spans the wider two-thirds column. */}
      <Card className="[--card-spacing:--spacing(6)] lg:col-span-2">
        <CardContent className="space-y-5">
          <Field label="Title" htmlFor="title">
            <Input
              id="title"
              name="title"
              required
              defaultValue={complaint?.title}
              placeholder="e.g. Large pothole on MG Road"
            />
          </Field>

          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              required
              rows={4}
              defaultValue={complaint?.description}
              placeholder="Describe the issue, when you noticed it, and any hazard it poses."
            />
          </Field>

          {/* Department + Priority share a row, mirroring the location grid. */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Department" htmlFor="departmentId">
              <NativeSelect
                id="departmentId"
                name="departmentId"
                required
                defaultValue={complaint?.departmentId ?? ""}
              >
                <option value="" disabled>
                  Select a department
                </option>
                {mockDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label="Priority" htmlFor="priority">
              <NativeSelect
                id="priority"
                name="priority"
                required
                defaultValue={complaint?.priority ?? "Medium"}
              >
                {COMPLAINT_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          {/* Address + Locality share a row. */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Address" htmlFor="address">
              <Input
                id="address"
                name="address"
                required
                defaultValue={complaint?.address}
                placeholder="Street address or landmark"
              />
            </Field>
            <Field label="Locality" htmlFor="locality">
              <Input
                id="locality"
                name="locality"
                required
                defaultValue={complaint?.locality}
                placeholder="Locality / area"
              />
            </Field>
          </div>

          {/* Structured India address cascade → submits state, city and PIN. */}
          <IndiaIssueLocationForm
            defaultValue={{
              state: complaint?.state,
              district: complaint?.district,
              city: complaint?.city,
              pincode: complaint?.pincode,
            }}
          />
        </CardContent>
      </Card>

      {/* Geo sidebar — the narrower one-third column. */}
      <Card className="[--card-spacing:--spacing(6)] lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground">
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LocationPicker
            lat={coords.lat}
            lng={coords.lng}
            onChange={(lat, lng) => setCoords({ lat, lng })}
          />
        </CardContent>
      </Card>
    </form>
  )
}
