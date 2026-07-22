"use client"

import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/components/shadcn/card"
import { Input } from "@/components/shadcn/input"
import { Label } from "@/components/shadcn/label"
import { toast } from "@/lib/styles/toast-styles"
import { routes } from "@/nav"
import type { CreateAgencyRequest } from "@/types/agency"
import type { AgencyView } from "./agency-list"

/** Shared `id` linking the header's submit button to this form. */
export const AGENCY_FORM_ID = "agency-form"

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

export function AgencyForm({
  mode,
  agency,
}: {
  mode: "create" | "edit"
  agency?: AgencyView
}) {
  const router = useRouter()
  const isEdit = mode === "edit"

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Collect the form into a typed payload, ready to POST/PATCH once the
    // backend lands. Native `required` + input types handle basic validation.
    const data = new FormData(event.currentTarget)
    const input: CreateAgencyRequest = {
      name: String(data.get("name") ?? "").trim(),
      contactPerson: String(data.get("contactPerson") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      registrationNumber: String(data.get("registrationNumber") ?? "").trim(),
      licenseNumber: String(data.get("licenseNumber") ?? "").trim(),
      maxProjects: Number(data.get("maxProjects") ?? 0),
    }

    if (isEdit && agency) {
      // TODO(backend): PATCH agencies/:id with { id: agency.id, ...input } (UpdateAgencyInput).
      toast.success("Agency updated", {
        description: `Your changes to ${input.name} have been saved.`,
      })
      router.push(routes.agencies.detail(agency.id).href)
    } else {
      // TODO(backend): POST agencies with `input` (CreateAgencyInput).
      toast.success("Agency registered", {
        description: `${input.name} has been added.`,
      })
      router.push(routes.agencies.href)
    }
  }

  return (
    <form id={AGENCY_FORM_ID} onSubmit={handleSubmit}>
      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent className="space-y-5">
          <Field label="Agency name" htmlFor="name">
            <Input
              id="name"
              name="name"
              required
              defaultValue={agency?.name}
              placeholder="Acme Constructions Pvt Ltd"
            />
          </Field>

          <Field label="Contact person" htmlFor="contactPerson">
            <Input
              id="contactPerson"
              name="contactPerson"
              required
              defaultValue={agency?.contactPerson}
              placeholder="Primary contact name"
            />
          </Field>

          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={agency?.email}
              placeholder="contact@agency.com"
            />
          </Field>

          <Field label="Phone" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={agency?.phone}
              placeholder="+91 98000 00000"
            />
          </Field>

          <Field label="Registration no." htmlFor="registrationNumber">
            <Input
              id="registrationNumber"
              name="registrationNumber"
              required
              defaultValue={agency?.registrationNumber}
              placeholder="REG-XXXX"
            />
          </Field>

          <Field label="License no." htmlFor="licenseNumber">
            <Input
              id="licenseNumber"
              name="licenseNumber"
              required
              defaultValue={agency?.licenseNumber}
              placeholder="LIC-XXXX"
            />
          </Field>

          <Field label="Max concurrent projects" htmlFor="maxProjects">
            <Input
              id="maxProjects"
              name="maxProjects"
              type="number"
              min={1}
              required
              defaultValue={agency?.maxProjects ?? 5}
            />
          </Field>
        </CardContent>
      </Card>
    </form>
  )
}
