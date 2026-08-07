"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card"
import { Input } from "@/components/shadcn/input"
import { Textarea } from "@/components/shadcn/textarea"
import { NativeSelect } from "@/components/shadcn/native-select"
import { Label } from "@/components/shadcn/label"
import { getApiErrorMessage } from "@/lib/api/error-message"
import {
  IMAGE_RULES,
  validateComplaintImages,
  validateComplaintInput,
} from "@/lib/utils/complaint/validate"
import { toast } from "@/lib/styles/toast-styles"
import { routes } from "@/nav"
import { usePublicDepartments } from "@/hooks/department"
import {
  useCreateComplaint,
  useUpdateComplaint,
} from "@/hooks/complaint"
import type {
  Complaint,
  CreateComplaintRequest,
  UpdateComplaintRequest,
} from "@/types/complaint"
import { LocationPicker } from "./location-picker"
import { IndiaIssueLocationForm } from "./india-issue-location-form"

/** Shared `id` linking the header's submit button to this form. */
export const COMPLAINT_FORM_ID = "complaint-form"

/** Max photos the backend accepts per complaint (`validate_images`). */
const MAX_COMPLAINT_IMAGES = IMAGE_RULES.maxCount

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
 * page. Submits to the complaints API (multipart, optional images). Priority is
 * not collected — the backend defaults it (AI sets it later). Title and the
 * Cancel/submit actions live in the page's PageHeader.
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

  const { data: departments, isPending: departmentsLoading } =
    usePublicDepartments()
  const createComplaint = useCreateComplaint()
  const updateComplaint = useUpdateComplaint()
  const pending = createComplaint.isPending || updateComplaint.isPending

  const [coords, setCoords] = useState<{
    lat: number | null
    lng: number | null
  }>({
    lat: complaint?.latitude ?? null,
    lng: complaint?.longitude ?? null,
  })
  const [images, setImages] = useState<File[]>([])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    const data = new FormData(event.currentTarget)
    const str = (key: string) => String(data.get(key) ?? "").trim()

    // `country`/`state`/`district`/`city`/`pincode` come from the India address
    // cascade's hidden inputs; lat/lng from the map picker state above (null
    // becomes NaN so the validator flags a missing pin).
    const base = {
      title: str("title"),
      description: str("description"),
      departmentId: Number(data.get("departmentId")),
      latitude: coords.lat ?? NaN,
      longitude: coords.lng ?? NaN,
      address: str("address"),
      locality: str("locality"),
      city: str("city"),
      district: str("district"),
      state: str("state"),
      country: str("country"),
      pincode: str("pincode"),
    }

    // Validate everything client-side (mirrors the backend) so the user gets a
    // specific message without a round-trip 422.
    const fieldError = validateComplaintInput(base)
    if (fieldError) {
      toast.error("Check the form", { description: fieldError })
      return
    }

    // Photos required on create, optional on edit.
    const imageError = validateComplaintImages(images, !isEdit)
    if (imageError) {
      toast.error("Photos", { description: imageError })
      return
    }

    const onError = (error: unknown) => {
      toast.error(isEdit ? "Couldn’t save changes" : "Couldn’t file complaint", {
        description: getApiErrorMessage(error, "Please try again."),
      })
    }

    if (isEdit && complaint) {
      updateComplaint.mutate(
        { id: complaint.id, input: base as UpdateComplaintRequest, images },
        {
          onSuccess: (updated) => {
            toast.success("Complaint updated", {
              description: "Your changes have been saved.",
            })
            router.push(routes.complaints.detail(updated.id).href)
            router.refresh()
          },
          onError,
        },
      )
    } else {
      createComplaint.mutate(
        { input: base as CreateComplaintRequest, images },
        {
          onSuccess: () => {
            toast.success("Complaint filed", {
              description: "Your complaint has been submitted for review.",
            })
            router.push(routes.complaints.href)
            router.refresh()
          },
          onError,
        },
      )
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
              minLength={5}
              maxLength={255}
              defaultValue={complaint?.title}
              placeholder="e.g. Large pothole on MG Road"
            />
          </Field>

          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              required
              minLength={10}
              rows={4}
              defaultValue={complaint?.description}
              placeholder="Describe the issue, when you noticed it, and any hazard it poses."
            />
          </Field>

          <Field label="Department" htmlFor="departmentId">
            <NativeSelect
              id="departmentId"
              name="departmentId"
              required
              defaultValue={complaint?.departmentId ?? ""}
              aria-busy={departmentsLoading}
            >
              <option value="" disabled>
                {departmentsLoading ? "Loading departments…" : "Select a department"}
              </option>
              {departments?.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          {/* Address + Locality share a row. */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Address" htmlFor="address">
              <Input
                id="address"
                name="address"
                required
                minLength={5}
                defaultValue={complaint?.address}
                placeholder="Street address or landmark"
              />
            </Field>
            <Field label="Locality" htmlFor="locality">
              <Input
                id="locality"
                name="locality"
                required
                minLength={2}
                defaultValue={complaint?.locality}
                placeholder="Locality / area"
              />
            </Field>
          </div>

          {/* Structured India address cascade → submits country, state, district,
              city and PIN as hidden inputs. */}
          <IndiaIssueLocationForm
            defaultValue={{
              state: complaint?.state,
              district: complaint?.district,
              city: complaint?.city,
              pincode: complaint?.pincode,
            }}
          />

          <Field
            label={isEdit ? "Photos (optional)" : "Photos"}
            htmlFor="images"
          >
            <Input
              id="images"
              name="images"
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              multiple
              required={!isEdit}
              onChange={(e) => setImages(Array.from(e.target.files ?? []))}
            />
            <p className="text-xs text-muted-foreground">
              {images.length > 0
                ? `${images.length} image${images.length > 1 ? "s" : ""} selected` +
                  (isEdit ? " — will replace existing photos." : ".")
                : isEdit
                  ? "Leave empty to keep the current photos."
                  : `Attach 1–${MAX_COMPLAINT_IMAGES} photos of the issue.`}
            </p>
          </Field>
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
