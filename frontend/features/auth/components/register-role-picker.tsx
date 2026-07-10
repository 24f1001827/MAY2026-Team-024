import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Building03Icon,
  ShieldUserIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

import { AuthShell, AuthAside } from "@/features/auth/components/auth-shell"
import { publicRoutes } from "@/nav"

type RoleCard = {
  role: string
  href: string
  description: string
  icon: IconSvgElement
}

const ROLES: RoleCard[] = [
  {
    role: "Citizen",
    href: publicRoutes.registerCitizen,
    description: "File complaints and track them to resolution.",
    icon: UserIcon,
  },
  {
    role: "Officer",
    href: publicRoutes.registerOfficer,
    description: "Handle assigned complaints for your department.",
    icon: ShieldUserIcon,
  },
  {
    role: "Agency",
    href: publicRoutes.registerAgency,
    description: "Bid on tenders and execute awarded work orders.",
    icon: Building03Icon,
  },
]

export function RegisterRolePicker() {
  return (
    <AuthShell
      aside={
        <AuthAside
          eyebrow="Get started"
          title="One platform. Three roles."
          description="Choose how you'll be using Rastro — every role plugs into the same transparent workflow."
        />
      }
    >
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pick the role that fits you to get started.
        </p>

        <div className="mt-8 space-y-3">
          {ROLES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-4 rounded-2xl border border-border p-4 transition-all hover:border-brand/40 hover:bg-accent"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <HugeiconsIcon icon={item.icon} />
              </span>
              <div className="flex-1">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  {item.role}
                </h2>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-brand"
              />
            </Link>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
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
