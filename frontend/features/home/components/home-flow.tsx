import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Megaphone01Icon,
  SearchList01Icon,
  Agreement02Icon,
  CheckmarkBadge02Icon,
} from "@hugeicons/core-free-icons"

type Stage = {
  step: string
  actor: string
  icon: IconSvgElement
  title: string
  description: string
}

const STAGES: Stage[] = [
  {
    step: "01",
    actor: "Citizen",
    icon: Megaphone01Icon,
    title: "Raise the complaint",
    description:
      "Report a civic issue with a location, photo, and category. It lands with the right department in seconds.",
  },
  {
    step: "02",
    actor: "Officer",
    icon: SearchList01Icon,
    title: "Review & triage",
    description:
      "An officer verifies the complaint, checks the ground reality, and decides whether it needs field work.",
  },
  {
    step: "03",
    actor: "Agency",
    icon: Agreement02Icon,
    title: "Issue a tender",
    description:
      "If work is needed, the officer floats a tender. Registered agencies bid, and the job is awarded transparently.",
  },
  {
    step: "04",
    actor: "Everyone",
    icon: CheckmarkBadge02Icon,
    title: "Resolve & verify",
    description:
      "The agency completes the work, the officer signs off, and the citizen sees their case closed — end to end.",
  },
]

export function HomeFlow() {
  return (
    <section className="rounded-3xl border border-border bg-card px-6 py-10 sm:px-10 sm:py-12">
      <div className="max-w-2xl">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
          How Rastro works
        </span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          One accountable trail, from report to resolution
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Every complaint follows the same transparent path across three roles —
          so responsibility is always clear and no case goes quiet.
        </p>
      </div>

      <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((stage, i) => (
          <li key={stage.step} className="relative">
            {/* connector line to next stage on desktop */}
            {i < STAGES.length - 1 && (
              <span
                aria-hidden
                className="absolute left-11 top-5 hidden h-px w-[calc(100%-1.5rem)] bg-gradient-to-r from-brand/40 to-transparent lg:block"
              />
            )}
            <div className="flex items-center gap-3">
              <span className="relative grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                <HugeiconsIcon icon={stage.icon} />
              </span>
              <span className="text-sm font-bold tabular-nums text-brand">
                {stage.step}
              </span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {stage.actor}
            </p>
            <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">
              {stage.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {stage.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
