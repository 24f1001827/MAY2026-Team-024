"use client"

/**
 * Project Command primitive (cmdk). Re-exports the shadcn Command so app code
 * imports from `@/components/shadcn/command` (per the wrapper convention)
 * instead of the raw `@/components/ui/command`. Powers the combobox pattern
 * (Popover + Command) used by the location pickers.
 */
export * from "@/components/ui/command"
