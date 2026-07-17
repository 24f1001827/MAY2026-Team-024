"use client"

import { Button } from "@/components/shadcn/button"
import { Input } from "@/components/shadcn/input"
import { Label } from "@/components/shadcn/label"
import { Checkbox } from "@/components/shadcn/checkbox"
import { toast } from "@/lib/styles/toast-styles"

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

export function SettingsForm({
  user,
  manualAllotment,
}: {
  user: { name: string; email: string; phone: string; role: string }
  /** Global complaint-allotment setting (admin-controlled). */
  manualAllotment: boolean
}) {
  const isAdmin = user.role === "Admin"

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    toast.success("Settings saved", {
      description: "Your account details have been updated.",
    })
  }

  function handleAllotmentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const enabled = new FormData(event.currentTarget).get("manualAllotment")
    toast.success("Allotment settings saved", {
      description: enabled
        ? "Complaints will wait for a department head to allot them."
        : "Complaints will be auto-assigned to the least-loaded officer.",
    })
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Account</h2>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-brand">
            {user.role}
          </span>
        </div>

        <Field label="Full name" htmlFor="name">
          <Input id="name" name="name" required defaultValue={user.name} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={user.email}
            />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={user.phone}
            />
          </Field>
        </div>

        <div className="pt-1">
          <Button type="submit" variant="brand">
            Save changes
          </Button>
        </div>
      </form>

      {isAdmin && (
        <form
          onSubmit={handleAllotmentSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6"
        >
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Complaint allotment
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Controls how complaints routed to a department are assigned.
            </p>
          </div>

          <label className="flex items-start gap-3">
            <Checkbox
              name="manualAllotment"
              defaultChecked={manualAllotment}
              className="mt-0.5"
            />
            <span className="space-y-0.5">
              <span className="block text-sm font-medium text-foreground">
                Manual allotment
              </span>
              <span className="block text-sm text-muted-foreground">
                When on, complaints wait in the department&apos;s queue for its
                head to allot. When off, they&apos;re auto-assigned to the
                least-loaded officer.
              </span>
            </span>
          </label>

          <Button type="submit" variant="brand">
            Save changes
          </Button>
        </form>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Switch between light and dark themes using the toggle in the top bar.
        </p>
      </div>
    </div>
  )
}
