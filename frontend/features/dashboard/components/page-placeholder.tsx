import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"

/**
 * Temporary scaffold for dashboard module pages. Renders a titled section with
 * a "coming soon" panel so routes exist for the nav platform (sidebar +
 * breadcrumbs) to consume. Replace with real module UI as features land.
 */
export function PagePlaceholder({
  title,
  description,
  icon,
}: {
  title: string
  description?: string
  icon?: IconSvgElement
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <HugeiconsIcon icon={icon} />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          This module is coming soon.
        </p>
      </div>
    </div>
  )
}
