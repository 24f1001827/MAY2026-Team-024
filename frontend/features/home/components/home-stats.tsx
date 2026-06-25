import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  AlarmClockIcon,
  CheckmarkCircle02Icon,
  Ticket01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

type Stat = {
  icon: IconSvgElement
  value: string
  label: string
}

const STATS: Stat[] = [
  { icon: Ticket01Icon, value: "1,284", label: "Complaints logged" },
  { icon: CheckmarkCircle02Icon, value: "94%", label: "Resolution rate" },
  { icon: AlarmClockIcon, value: "1.8 days", label: "Avg. time to resolve" },
  { icon: UserGroupIcon, value: "12", label: "Active teams" },
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
