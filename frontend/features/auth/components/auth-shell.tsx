import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Agreement02Icon,
  CheckmarkBadge02Icon,
  Megaphone01Icon,
  SearchList01Icon,
} from "@hugeicons/core-free-icons"

import { publicRoutes } from "@/nav"

// The signature civic pipeline, echoed from the marketing home page.
const AUTH_STEPS: { icon: IconSvgElement; label: string; meta: string }[] = [
  { icon: Megaphone01Icon, label: "Citizens raise", meta: "Report an issue in seconds" },
  { icon: SearchList01Icon, label: "Officers review", meta: "Verify and triage the case" },
  { icon: Agreement02Icon, label: "Agencies deliver", meta: "Win the tender, do the work" },
  { icon: CheckmarkBadge02Icon, label: "Everyone tracks", meta: "Followed to resolution" },
]

/**
 * Branded navy panel for the auth pages — mirrors the home hero (gradient,
 * brand glows, eyebrow badge, civic pipeline). Pass page-specific copy.
 */
export function AuthAside({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <>
      <Link
        href={publicRoutes.home}
        aria-label="Rastro home"
        className="inline-flex items-center gap-2.5"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
          R
        </span>
        <span className="text-lg font-bold tracking-tight text-white">
          Rastro
        </span>
      </Link>

      <div className="mt-auto pt-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
          <span className="size-1.5 animate-pulse rounded-full bg-brand" />
          {eyebrow}
        </span>

        <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
          {description}
        </p>

        <ol className="mt-8 space-y-4">
          {AUTH_STEPS.map((step) => (
            <li key={step.label} className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand">
                <HugeiconsIcon icon={step.icon} size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{step.label}</p>
                <p className="text-xs text-white/60">{step.meta}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}

/**
 * Two-panel auth container: branded navy aside (desktop) + form area. Provides
 * its own page padding, so pages can render it directly.
 */
export function AuthShell({
  aside,
  children,
}: {
  aside: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative hidden overflow-hidden bg-[linear-gradient(135deg,_oklch(0.30_0.11_262)_0%,_oklch(0.18_0.06_260)_100%)] p-8 text-white lg:flex lg:flex-col xl:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-brand/25 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-brand-2/20 blur-3xl"
            />
            <div className="relative flex h-full flex-col">{aside}</div>
          </aside>

          <div className="p-6 sm:p-10">{children}</div>
        </div>
      </div>
    </div>
  )
}
