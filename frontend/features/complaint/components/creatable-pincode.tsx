"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, PlusSignIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/shadcn/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover"
import { cn } from "@/lib/utils"

/** A valid Indian PIN code: exactly six digits. */
const PIN_REGEX = /^\d{6}$/

export interface CreatablePincodeProps {
  /** Id for the trigger, so an external `<Label htmlFor>` can point at it. */
  id?: string
  /** Currently selected PIN code (controlled). */
  value: string
  /** Fires with the chosen PIN — an existing option or a valid custom one. */
  onChange: (value: string) => void
  /** Known PIN codes for the selected city. */
  options: string[]
  /** Disabled until an upstream selection (e.g. city) exists. */
  disabled?: boolean
  /** Shows a loading affordance while `options` are being fetched. */
  loading?: boolean
  placeholder?: string
}

/**
 * A searchable PIN-code combobox (Popover + Command) that also accepts custom
 * values. When the typed query is a valid 6-digit PIN not present in `options`,
 * a "Use custom PIN: …" item appears so the user can commit it. Input is
 * constrained to digits and capped at six characters.
 */
export function CreatablePincode({
  id,
  value,
  onChange,
  options,
  disabled = false,
  loading = false,
  placeholder = "Select or type a PIN code",
}: CreatablePincodeProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const canCreate = PIN_REGEX.test(query) && !options.includes(query)

  function select(next: string) {
    onChange(next)
    setQuery("")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {value || (loading ? "Loading PIN codes…" : placeholder)}
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            className="size-4 shrink-0 opacity-50"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        {/* Match on substring so numeric codes filter predictably. */}
        <Command filter={(itemValue, search) => (itemValue.includes(search) ? 1 : 0)}>
          <CommandInput
            value={query}
            onValueChange={(next) => setQuery(next.replace(/\D/g, "").slice(0, 6))}
            placeholder="Search or type a 6-digit PIN…"
            inputMode="numeric"
          />
          <CommandList>
            {!canCreate && <CommandEmpty>No matching PIN code.</CommandEmpty>}

            {options.length > 0 && (
              <CommandGroup heading="Known PIN codes">
                {options.map((pin) => (
                  <CommandItem
                    key={pin}
                    value={pin}
                    data-checked={pin === value ? "true" : undefined}
                    onSelect={() => select(pin)}
                  >
                    {pin}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {canCreate && (
              <CommandGroup>
                <CommandItem value={query} onSelect={() => select(query)}>
                  <HugeiconsIcon
                    icon={PlusSignIcon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                  Use custom PIN: {query}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
