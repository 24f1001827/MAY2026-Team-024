"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building03Icon,
  LockPasswordIcon,
  Mail01Icon,
  ShieldUserIcon,
  SmartPhone01Icon,
  UserIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

import { Button } from "@/components/shadcn/button"
import { Input } from "@/components/shadcn/input"
import { NativeSelect } from "@/components/shadcn/native-select"
import { AuthShell, AuthAside } from "@/features/auth/components/auth-shell"
import { mockDepartments } from "@/components/shared/mock-data"
import { toast } from "@/lib/styles/toast-styles"
import { publicRoutes } from "@/nav"
import type { UserRole } from "@/types/user"

type RegisterRole = Extract<UserRole, "Citizen" | "Officer" | "Agency">

const ROLE_CONFIG: Record<
  RegisterRole,
  {
    title: string
    subtitle: string
    nameLabel: string
    icon: IconSvgElement
    asideTitle: string
    asideDescription: string
  }
> = {
  Citizen: {
    title: "Create your account",
    subtitle: "File complaints and track them to resolution.",
    nameLabel: "Full name",
    icon: UserIcon,
    asideTitle: "Your voice, tracked to the fix.",
    asideDescription:
      "Report civic issues and follow every case — from the moment you file it to the day it's resolved.",
  },
  Officer: {
    title: "Register as an officer",
    subtitle: "Handle assigned complaints for your department.",
    nameLabel: "Full name",
    icon: ShieldUserIcon,
    asideTitle: "Review, decide, get work moving.",
    asideDescription:
      "Triage complaints for your department and float tenders with a clear, accountable audit trail.",
  },
  Agency: {
    title: "Register your agency",
    subtitle: "Bid on tenders and execute awarded work orders.",
    nameLabel: "Agency name",
    icon: Building03Icon,
    asideTitle: "Win work and deliver for your city.",
    asideDescription:
      "Discover open tenders, submit competitive bids, and manage awarded work orders end to end.",
  },
}

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
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

export function RegisterForm({ role }: { role: RegisterRole }) {
  const config = ROLE_CONFIG[role]
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // TODO: wire up to auth backend (role = {role})
    toast.success("Account created", {
      description: `Your ${role} account is pending approval. Please sign in.`,
    })
    // Redirect to login after successful registration.
    router.push(publicRoutes.login)
  }

  return (
    <AuthShell
      aside={
        <AuthAside
          eyebrow={`Register · ${role}`}
          title={config.asideTitle}
          description={config.asideDescription}
        />
      }
    >
      <div className="mx-auto w-full max-w-md">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
          <HugeiconsIcon icon={config.icon} className="size-3.5" />
          {role}
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          {config.title}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{config.subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Field label={config.nameLabel} htmlFor="name">
            <div className="relative">
              <HugeiconsIcon
                icon={role === "Agency" ? Building03Icon : UserIcon}
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="name"
                name="name"
                required
                placeholder={
                  role === "Agency" ? "Acme Constructions Pvt Ltd" : "Your name"
                }
                className="pl-9"
              />
            </div>
          </Field>

          {role === "Agency" && (
            <Field label="Contact person" htmlFor="contactPerson">
              <Input
                id="contactPerson"
                name="contactPerson"
                required
                placeholder="Primary contact name"
              />
            </Field>
          )}

          <Field label="Email" htmlFor="email">
            <div className="relative">
              <HugeiconsIcon
                icon={Mail01Icon}
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Phone" htmlFor="phone">
            <div className="relative">
              <HugeiconsIcon
                icon={SmartPhone01Icon}
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                placeholder="+91 98000 00000"
                className="pl-9"
              />
            </div>
          </Field>

          {role === "Officer" && (
            <Field label="Department" htmlFor="departmentId">
              <NativeSelect
                id="departmentId"
                name="departmentId"
                required
                defaultValue=""
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
          )}

          {role === "Agency" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Registration no." htmlFor="registrationNumber">
                <Input
                  id="registrationNumber"
                  name="registrationNumber"
                  required
                  placeholder="REG-XXXX"
                />
              </Field>
              <Field label="License no." htmlFor="licenseNumber">
                <Input
                  id="licenseNumber"
                  name="licenseNumber"
                  required
                  placeholder="LIC-XXXX"
                />
              </Field>
            </div>
          )}

          <Field label="Password" htmlFor="password">
            <div className="relative">
              <HugeiconsIcon
                icon={LockPasswordIcon}
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="px-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
              >
                <HugeiconsIcon
                  icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                  className="size-4"
                />
              </button>
            </div>
          </Field>

          <Button type="submit" variant="brand" size="lg" className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={publicRoutes.login}
            className="font-medium text-brand transition-opacity hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
