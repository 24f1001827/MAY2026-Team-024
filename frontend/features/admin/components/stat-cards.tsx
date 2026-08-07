import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"

import { Card } from "@/components/shadcn/card"
import { cn } from "@/lib/utils"

export interface StatItem {
  label: string
  count: number
  icon: IconSvgElement
  description: string
  iconBg: string
  iconClass: string
}

/**
 * A row of summary stat cards (up to 4), styled like the officer stats card.
 * The admin dashboard swaps the `stats` it passes based on the active tab.
 */
export function StatCards({ stats }: { stats: StatItem[] }) {
  const cols = stats.length >= 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"

  return (
    <Card className="gap-0 p-6">
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:gap-0 sm:divide-x sm:divide-border",
          cols,
        )}
      >
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col gap-1 rounded-lg p-3 sm:rounded-none",
              i === 0
                ? "sm:pr-6"
                : i === stats.length - 1
                  ? "sm:pl-6"
                  : "sm:px-6",
            )}
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {stat.count}
              </p>
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  stat.iconBg,
                )}
              >
                <HugeiconsIcon icon={stat.icon} size={16} className={stat.iconClass} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground/70">{stat.description}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
