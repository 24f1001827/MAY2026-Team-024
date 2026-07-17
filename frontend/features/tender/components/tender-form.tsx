"use client"

import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/components/shadcn/card"
import { Input } from "@/components/shadcn/input"
import { Textarea } from "@/components/shadcn/textarea"
import { NativeSelect } from "@/components/shadcn/native-select"
import { Label } from "@/components/shadcn/label"
import { toast } from "@/lib/styles/toast-styles"
import { routes } from "@/nav"
import { mockComplaints } from "@/components/shared/mock-data"
import { TENDER_STATUSES } from "@/types/tender"
import type { TenderView } from "./tender-list"

/** Shared `id` linking the header's submit button to this form. */
export const TENDER_FORM_ID = "tender-form"

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

export function TenderForm({
  mode,
  tender,
}: {
  mode: "create" | "edit"
  tender?: TenderView
}) {
  const router = useRouter()
  const isEdit = mode === "edit"

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isEdit && tender) {
      toast.success("Tender updated", {
        description: "Your changes have been saved.",
      })
      router.push(routes.tenders.detail(tender.id).href)
    } else {
      toast.success("Tender created", {
        description: "The tender has been published.",
      })
      router.push(routes.tenders.href)
    }
  }

  return (
    <form id={TENDER_FORM_ID} onSubmit={handleSubmit}>
      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent className="space-y-5">
          <Field label="Title" htmlFor="title">
            <Input
              id="title"
              name="title"
              required
              defaultValue={tender?.title}
              placeholder="e.g. Road resurfacing — MG Road junction"
            />
          </Field>

          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              required
              rows={4}
              defaultValue={tender?.description}
              placeholder="Scope of work to be carried out."
            />
          </Field>

          <Field label="Complaint" htmlFor="complaintId">
            <NativeSelect
              id="complaintId"
              name="complaintId"
              required
              defaultValue={tender?.complaintId ?? ""}
            >
              <option value="" disabled>
                Select the complaint this tender addresses
              </option>
              {mockComplaints.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Estimated cost (₹)" htmlFor="estimatedCost">
            <Input
              id="estimatedCost"
              name="estimatedCost"
              type="number"
              min={0}
              required
              defaultValue={tender?.estimatedCost}
              placeholder="850000"
            />
          </Field>

          <Field label="Closing date" htmlFor="closingDate">
            <Input
              id="closingDate"
              name="closingDate"
              type="date"
              required
              defaultValue={tender?.closingDate.slice(0, 10)}
            />
          </Field>

          <Field label="Status" htmlFor="status">
            <NativeSelect
              id="status"
              name="status"
              defaultValue={tender?.status ?? "Draft"}
            >
              {TENDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>
    </form>
  )
}
