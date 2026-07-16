import type * as React from "react"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: React.ReactNode
  /** Actions (buttons, etc.) rendered on the right of the header. */
  actions?: React.ReactNode
  className?: string
  /**
   * When true the header sticks below the dashboard app bar (which is `h-16`)
   * while the page scrolls beneath it. Use on create/edit pages so the header
   * actions (Cancel / Save) stay reachable without scrolling. The negative
   * margins cancel the `<main>` padding so the sticky bar spans full width.
   */
  sticky?: boolean
}

/**
 * Page title block with an optional right-aligned actions slot. On create/edit
 * pages the Cancel and submit buttons live here (submit targets the form via
 * `form={FORM_ID}`), keeping them out of the scrolling form body.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
  sticky,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        sticky &&
          "sticky top-16 z-10 -mx-4 -mt-4 border-b border-border bg-background px-4 py-3 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:px-8",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
