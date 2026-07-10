import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  UserIcon,
  ShieldUserIcon,
  Building03Icon,
} from "@hugeicons/core-free-icons"

import { publicRoutes } from "@/nav"

type Role = {
  name: string
  href: string
  icon: IconSvgElement
  tagline: string
  points: string[]
}

const ROLES: Role[] = [
  {
    name: "Citizens",
    href: publicRoutes.registerCitizen,
    icon: UserIcon,
    tagline: "Report and follow up",
    points: [
      "File a complaint in under a minute",
      "Track it live from filing to fix",
      "Get notified at every status change",
    ],
  },
  {
    name: "Officers",
    href: publicRoutes.registerOfficer,
    icon: ShieldUserIcon,
    tagline: "Review and act",
    points: [
      "Triage complaints for your department",
      "Float and award tenders with an audit trail",
      "Verify completed work before closing",
    ],
  },
  {
    name: "Agencies",
    href: publicRoutes.registerAgency,
    icon: Building03Icon,
    tagline: "Bid and deliver",
    points: [
      "Discover open tenders in your field",
      "Submit competitive bids online",
      "Manage awarded work orders end to end",
    ],
  },
]

export function HomeRoles() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            Built for every stakeholder
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Pick the role that fits you
          </h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {ROLES.map((role) => (
          <Link
            key={role.name}
            href={role.href}
            className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
              <HugeiconsIcon icon={role.icon} />
            </span>
            <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
              {role.name}
            </h3>
            <p className="text-sm text-muted-foreground">{role.tagline}</p>

            <ul className="mt-4 flex-1 space-y-2">
              {role.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                  {point}
                </li>
              ))}
            </ul>

            <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand">
              Get started
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
