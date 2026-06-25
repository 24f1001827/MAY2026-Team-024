import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Analytics01Icon,
  ClipboardClockIcon,
  CommentAdd01Icon,
} from "@hugeicons/core-free-icons"

type Feature = {
  icon: IconSvgElement
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: CommentAdd01Icon,
    title: "Submit in seconds",
    description:
      "Capture the issue, category, and priority with a short form. Attach evidence and route it to the right team automatically.",
  },
  {
    icon: ClipboardClockIcon,
    title: "Track every step",
    description:
      "Follow each complaint through its lifecycle — open, in progress, and resolved — with a full timeline of updates.",
  },
  {
    icon: Analytics01Icon,
    title: "See the bigger picture",
    description:
      "Spot recurring problems and bottlenecks with resolution trends and team performance at a glance.",
  },
]

export function HomeFeatures() {
  return (
    <section className="grid gap-3 sm:gap-4 md:grid-cols-3">
      {FEATURES.map((feature) => (
        <article
          key={feature.title}
          className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <HugeiconsIcon icon={feature.icon} />
          </span>
          <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
            {feature.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {feature.description}
          </p>
        </article>
      ))}
    </section>
  )
}
