import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Megaphone01Icon,
  Agreement02Icon,
  CheckmarkBadge02Icon,
  Building03Icon,
} from "@hugeicons/core-free-icons"

import { fetchPublicStats } from "@/lib/api/public-stats"

type Stat = {
  icon: IconSvgElement
  value: string
  label: string
}

/** Server component — fetches real, non-sensitive platform stats. */
export async function HomeStats() {
  const stats = await fetchPublicStats()
  const nf = new Intl.NumberFormat("en-IN")

  const STATS: Stat[] = [
    {
      icon: Megaphone01Icon,
      value: nf.format(stats.complaintsTotal),
      label: "Complaints raised",
    },
    {
      icon: Agreement02Icon,
      value: nf.format(stats.tendersAwarded),
      label: "Tenders awarded",
    },
    {
      icon: CheckmarkBadge02Icon,
      value: `${stats.resolvedPct}%`,
      label: "Cases resolved",
    },
    {
      icon: Building03Icon,
      value: nf.format(stats.agenciesTotal),
      label: "Partner agencies",
    },
  ]

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {STATS.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-brand/10 text-brand">
            <HugeiconsIcon icon={stat.icon} />
          </span>
          <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {stat.value}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </section>
  )
}
