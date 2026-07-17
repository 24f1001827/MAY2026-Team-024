import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Briefcase01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { Card } from "@/components/shadcn/card"
import { cn } from "@/lib/utils"

interface OfficerStatsCardProps {
  total: number
  available: number
  engaged: number
  onLeave: number
}

type Stat = {
  label: string
  count: number
  icon: IconSvgElement
  description: string
  valueClass: string
  iconBg: string
  iconClass: string
}

export function OfficerStatsCard({
  total,
  available,
  engaged,
  onLeave,
}: OfficerStatsCardProps) {
  const stats: Stat[] = [
    {
      label: "Total Officers",
      count: total,
      icon: UserGroupIcon,
      description: "across all departments",
      valueClass: "text-foreground",
      iconBg: "bg-brand/10",
      iconClass: "text-brand",
    },
    {
      label: "Available",
      count: available,
      icon: CheckmarkCircle02Icon,
      description: "ready for assignment",
      valueClass: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10",
      iconClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Engaged",
      count: engaged,
      icon: Briefcase01Icon,
      description: "currently working",
      valueClass: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/10",
      iconClass: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "On Leave",
      count: onLeave,
      icon: Calendar03Icon,
      description: "temporarily away",
      valueClass: "text-muted-foreground",
      iconBg: "bg-muted",
      iconClass: "text-muted-foreground",
    },
  ]

  return (
    <Card className="gap-0 p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-border">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col gap-1 rounded-lg p-3 sm:rounded-none",
              i === 0 ? "sm:pr-6" : i === 3 ? "sm:pl-6" : "sm:px-6"
            )}
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <div className="flex items-center justify-between">
              <p
                className={cn(
                  "text-2xl font-bold tracking-tight",
                  stat.valueClass
                )}
              >
                {stat.count}
              </p>
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  stat.iconBg
                )}
              >
                <HugeiconsIcon
                  icon={stat.icon}
                  size={16}
                  className={stat.iconClass}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground/70">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
