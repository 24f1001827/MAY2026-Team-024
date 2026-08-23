"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building03Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
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
import { NumericInput } from "@/components/shadcn/numeric-input"
import { AuthShell, AuthAside } from "@/features/auth/components/auth-shell"
import { useRegister } from "@/hooks/auth"
import {
  checkPassword,
  PASSWORD_MIN_LENGTH,
  validateRegisterInput,
} from "@/lib/utils/auth/validate"
import { usePublicDepartments } from "@/hooks/department"
import { toast } from "@/lib/styles/toast-styles"
import { publicRoutes } from "@/nav"
import type { UserRole } from "@/types/user"
import type { RegisterInput } from "@/types/auth"

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

/**
 * Live password requirement checklist. The backend reports only the first
 * failing rule, so showing all of them at once is the difference between one
 * correction and five round-trips.
 */
function PasswordRequirements({
  rules,
  show,
}: {
  rules: { rule: { id: string; label: string }; met: boolean }[]
  show: boolean
}) {
  return (
    <ul className="mt-2 space-y-1" aria-live="polite">
      {rules.map(({ rule, met }) => (
        <li
          key={rule.id}
          className={`flex items-center gap-1.5 text-xs ${
            met
              ? "text-emerald-600 dark:text-emerald-400"
              : show
                ? "text-destructive"
                : "text-muted-foreground"
          }`}
        >
          <HugeiconsIcon
            icon={met ? CheckmarkCircle02Icon : CancelCircleIcon}
            className="size-3.5 shrink-0"
          />
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Officer-only department picker. Fetches the real department list from the
 * public endpoint so the submitted `department` name matches a row the backend
 * can resolve (`DepartmentRepository.get_by_name`). Only mounted for the
 * officer form, so the query never fires on the citizen/agency pages.
 */
function DepartmentSelect() {
  const { data: departments, isPending, isError, refetch } = usePublicDepartments()

  return (
    <Field label="Department" htmlFor="department">
      <NativeSelect
        id="department"
        name="department"
        required
        defaultValue=""
        aria-busy={isPending}
      >
        <option value="" disabled>
          {isPending
            ? "Loading departments…"
            : isError
              ? "Couldn't load departments"
              : "Select a department"}
        </option>
        {departments?.map((department) => (
          <option key={department.id} value={department.name}>
            {department.name}
          </option>
        ))}
      </NativeSelect>
      {isError && (
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs font-medium text-destructive underline-offset-2 hover:underline"
        >
          Retry
        </button>
      )}
    </Field>
  )
}

export function RegisterForm({ role }: { role: RegisterRole }) {
  const config = ROLE_CONFIG[role]
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  // The checklist stays quiet until the field has been used or a submit was
  // rejected, so an untouched form doesn't open covered in red.
  const [passwordTouched, setPasswordTouched] = useState(false)
  const register = useRegister()

  const passwordRules = checkPassword(password)
  const passwordReady = passwordRules.every((entry) => entry.met)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (register.isPending) return

    const data = new FormData(event.currentTarget)
    const str = (key: string) => String(data.get(key) ?? "").trim()

    // Map the form fields to the backend's snake_case payload per role.
    const base = {
      name: str("name"),
      email: str("email"),
      phone: str("phone"),
      password: String(data.get("password") ?? ""),
    }
    // Validate everything client-side (mirrors the backend) so the user gets a
    // specific message without a round-trip 422 — and, for the password, sees
    // every unmet requirement in the checklist rather than one per attempt.
    const fieldError = validateRegisterInput({
      ...base,
      ...(role === "Officer" ? { department: str("department") } : {}),
      ...(role === "Agency"
        ? {
            contactPerson: str("contactPerson"),
            registrationNumber: str("registrationNumber"),
            licenseNumber: str("licenseNumber"),
          }
        : {}),
    })
    if (fieldError) {
      setPasswordTouched(true)
      toast.error("Check your details", { description: fieldError })
      return
    }

    const input: RegisterInput =
      role === "Officer"
        ? { role: "officer", payload: { ...base, department: str("department") } }
        : role === "Agency"
          ? {
              role: "agency",
              payload: {
                ...base,
                contact_person: str("contactPerson"),
                registration_number: str("registrationNumber"),
                license_number: str("licenseNumber"),
              },
            }
          : { role: "citizen", payload: base }

    register.mutate(input, {
      onSuccess: () => {
        toast.success("Account created", {
          description:
            role === "Citizen"
              ? "You can sign in now."
              : `Your ${role} account is pending approval. Please sign in once approved.`,
        })
        router.push(publicRoutes.login)
      },
      onError: (error) => {
        toast.error("Couldn't create account", {
          description:
            error instanceof Error
              ? error.message
              : "Please review your details and try again.",
        })
      },
    })
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
              <NumericInput
                id="phone"
                name="phone"
                autoComplete="tel"
                required
                maxDigits={10}
                pattern="[6-9][0-9]{9}"
                title="Enter a 10-digit mobile number starting with 6, 7, 8, or 9."
                placeholder="9800000000"
                className="pl-9"
              />
            </div>
          </Field>

          {role === "Officer" && <DepartmentSelect />}

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
                minLength={PASSWORD_MIN_LENGTH}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => setPasswordTouched(true)}
                aria-invalid={passwordTouched && !passwordReady}
                aria-describedby="password-requirements"
                placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
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
            <div id="password-requirements">
              <PasswordRequirements
                rules={passwordRules}
                show={passwordTouched}
              />
            </div>
          </Field>

          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="w-full"
            disabled={register.isPending}
          >
            {register.isPending ? "Creating account…" : "Create account"}
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
