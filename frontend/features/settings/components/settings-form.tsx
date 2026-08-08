"use client"

import { Button } from "@/components/shadcn/button"
import { Input } from "@/components/shadcn/input"
import { Label } from "@/components/shadcn/label"
import { PageHeader } from "@/features/common/components/page-header"
import { toast } from "@/lib/styles/toast-styles"
import { AllotmentSettings } from "@/features/settings/components/allotment-settings"

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
}: {
  user: { name: string; email: string; phone: string; role: string }
}) {
  const isAdmin = user.role === "Admin"

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    toast.success("Settings saved", {
      description: "Your account details have been updated.",
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences."
      />

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

      {isAdmin && <AllotmentSettings />}

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Switch between light and dark themes using the toggle in the top bar.
        </p>
      </div>
    </div>
  )
}
