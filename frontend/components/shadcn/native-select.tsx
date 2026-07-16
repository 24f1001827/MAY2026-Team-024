import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Project native `<select>` primitive for form fields. Styled to match the
 * shadcn Input's border and focus-ring treatment so dropdowns and text inputs
 * feel consistent across forms. Import this (`@/components/shadcn/native-select`)
 * instead of a raw `<select>` — pair it with plain `<option>` children.
 */
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { NativeSelect }
