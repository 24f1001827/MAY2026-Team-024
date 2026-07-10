import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Megaphone01Icon,
  SearchList01Icon,
  Agreement02Icon,
  CheckmarkBadge02Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

import { Button } from "@/components/shadcn/button"
import { publicRoutes } from "@/nav"

type CaseStep = {
  icon: IconSvgElement
  label: string
  meta: string
  done: boolean
  active?: boolean
}

const CASE_STEPS: CaseStep[] = [
  { icon: Megaphone01Icon, label: "Filed by citizen", meta: "Ward 12 · Streetlight out", done: true },
  { icon: SearchList01Icon, label: "Reviewed by officer", meta: "Public Works · verified", done: true },
  { icon: Agreement02Icon, label: "Tender issued to agency", meta: "TND-4471 · awarded", active: true, done: false },
  { icon: CheckmarkBadge02Icon, label: "Work verified & closed", meta: "Awaiting sign-off", done: false },
]

export function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,_oklch(0.30_0.11_262)_0%,_oklch(0.18_0.06_260)_100%)] px-6 py-14 text-white sm:px-12 sm:py-20">
      {/* decorative brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-brand-2/20 blur-3xl"
      />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            <span className="size-1.5 animate-pulse rounded-full bg-brand" />
            Civic complaints &amp; public tenders
          </span>

          <h1 className="mt-5 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            From a citizen&apos;s report to{" "}
            <span className="text-brand">work on the ground.</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
            Rastro connects the people who spot a problem, the officers who
            review it, and the agencies who fix it — so nothing stalls between
            a complaint being raised and the pothole actually getting filled.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="brand" size="lg">
              <Link href={publicRoutes.registerCitizen}>
                <HugeiconsIcon icon={Megaphone01Icon} />
                Raise a complaint
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href={publicRoutes.login}>
                Officer &amp; agency sign-in
                <HugeiconsIcon icon={ArrowRight01Icon} />
              </Link>
            </Button>
          </div>
        </div>

        {/* Live case dossier */}
        <div className="rounded-2xl border border-white/10 bg-card p-5 text-card-foreground shadow-2xl shadow-black/40 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Case #CMP-2048
              </p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                Broken streetlight, MG Road
              </p>
            </div>
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
              In tender
            </span>
          </div>

          <ol className="mt-6 space-y-1">
            {CASE_STEPS.map((step, i) => (
              <li key={step.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={[
                      "grid size-8 place-items-center rounded-full border",
                      step.done
                        ? "border-transparent bg-brand text-brand-foreground"
                        : step.active
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    <HugeiconsIcon icon={step.icon} size={16} />
                  </span>
                  {i < CASE_STEPS.length - 1 && (
                    <span
                      className={[
                        "my-1 w-px flex-1",
                        step.done ? "bg-brand/40" : "bg-border",
                      ].join(" ")}
                    />
                  )}
                </div>
                <div className="pb-4">
                  <p
                    className={[
                      "text-sm font-medium",
                      step.done || step.active
                        ? "text-foreground"
                        : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.meta}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
