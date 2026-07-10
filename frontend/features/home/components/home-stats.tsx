import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Megaphone01Icon,
  Agreement02Icon,
  CheckmarkBadge02Icon,
  Building03Icon,
} from "@hugeicons/core-free-icons"

type Stat = {
  icon: IconSvgElement
  value: string
  label: string
}

const STATS: Stat[] = [
  { icon: Megaphone01Icon, value: "12,480", label: "Complaints raised" },
  { icon: Agreement02Icon, value: "3,140", label: "Tenders awarded" },
  { icon: CheckmarkBadge02Icon, value: "92%", label: "Cases resolved" },
  { icon: Building03Icon, value: "186", label: "Partner agencies" },
]

export function HomeStats() {
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
