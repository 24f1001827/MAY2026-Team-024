"use client"

import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, RefreshIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/shadcn/command"
import { Input } from "@/components/shadcn/input"
import { Label } from "@/components/shadcn/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover"
import {
  getCities,
  getDistricts,
  getPincodes,
  getStates,
} from "@/lib/utils/complaint/location-data"
import { cn } from "@/lib/utils"
import { CreatablePincode } from "./creatable-pincode"

/** Country is fixed for this product — citizens report issues within India. */
const COUNTRY = "India"

export interface LocationValue {
  country: string
  state: string
  district: string
  city: string
  pincode: string
}

export interface IndiaIssueLocationFormProps {
  /** Pre-fill (e.g. when editing an existing complaint). */
  defaultValue?: Partial<Omit<LocationValue, "country">>
  /** Notified on every field change with the full current location. */
  onChange?: (value: LocationValue) => void
}

/** Empty option for a labelled combobox field. */
type Field = {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
}

function LocationField({ label, htmlFor, hint, children }: Field) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

/** A read-only searchable combobox that selects one name from `options`. */
function SelectCombobox({
  id,
  value,
  onChange,
  options,
  disabled = false,
  loading = false,
  placeholder,
  searchPlaceholder,
  emptyText,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  options: string[]
  disabled?: boolean
  loading?: boolean
  placeholder: string
  searchPlaceholder: string
  emptyText: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "h-10 w-full justify-between font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {value || (loading ? "Loading…" : placeholder)}
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
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  data-checked={option === value ? "true" : undefined}
                  onSelect={() => {
                    onChange(option)
                    setOpen(false)
                  }}
                >
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Cascading India address picker: Country (fixed) → State → District →
 * City/Sub-district → PIN code. Each level unlocks the next and resets every
 * downstream field. Option lists load lazily from server actions so the postal
 * dataset stays off the client. Renders hidden inputs (`country`, `state`,
 * `district`, `city`, `pincode`) so it drops into a parent `<form>` — and can
 * be driven via `onChange` for controlled use.
 */
export function IndiaIssueLocationForm({
  defaultValue,
  onChange,
}: IndiaIssueLocationFormProps) {
  const [state, setState] = useState(defaultValue?.state ?? "")
  const [district, setDistrict] = useState(defaultValue?.district ?? "")
  const [city, setCity] = useState(defaultValue?.city ?? "")
  const [pincode, setPincode] = useState(defaultValue?.pincode ?? "")

  const [states, setStates] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [pincodes, setPincodes] = useState<string[]>([])

  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingPincodes, setLoadingPincodes] = useState(false)

  // Each level fetches its children whenever its path changes. The guards keep
  // setState out of the synchronous effect body (only the async resolution
  // updates state); downstream lists are cleared eagerly in the handlers below.
  useEffect(() => {
    let active = true
    getStates().then((next) => active && setStates(next))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!state) return
    let active = true
    getDistricts(state).then((next) => {
      if (!active) return
      setDistricts(next)
      setLoadingDistricts(false)
    })
    return () => {
      active = false
    }
  }, [state])

  useEffect(() => {
    if (!state || !district) return
    let active = true
    getCities(state, district).then((next) => {
      if (!active) return
      setCities(next)
      setLoadingCities(false)
    })
    return () => {
      active = false
    }
  }, [state, district])

  useEffect(() => {
    if (!state || !district || !city) return
    let active = true
    getPincodes(state, district, city).then((next) => {
      if (!active) return
      setPincodes(next)
      setLoadingPincodes(false)
    })
    return () => {
      active = false
    }
  }, [state, district, city])

  function emit(next: LocationValue) {
    onChange?.(next)
  }

  function handleState(next: string) {
    setState(next)
    setDistrict("")
    setCity("")
    setPincode("")
    setDistricts([])
    setCities([])
    setPincodes([])
    setLoadingDistricts(true)
    setLoadingCities(false)
    setLoadingPincodes(false)
    emit({ country: COUNTRY, state: next, district: "", city: "", pincode: "" })
  }

  function handleDistrict(next: string) {
    setDistrict(next)
    setCity("")
    setPincode("")
    setCities([])
    setPincodes([])
    setLoadingCities(true)
    setLoadingPincodes(false)
    emit({ country: COUNTRY, state, district: next, city: "", pincode: "" })
  }

  function handleCity(next: string) {
    setCity(next)
    setPincode("")
    setPincodes([])
    setLoadingPincodes(true)
    emit({ country: COUNTRY, state, district, city: next, pincode: "" })
  }

  function handlePincode(next: string) {
    setPincode(next)
    emit({ country: COUNTRY, state, district, city, pincode: next })
  }

  function resetLocation() {
    setState("")
    setDistrict("")
    setCity("")
    setPincode("")
    setDistricts([])
    setCities([])
    setPincodes([])
    setLoadingDistricts(false)
    setLoadingCities(false)
    setLoadingPincodes(false)
    emit({ country: COUNTRY, state: "", district: "", city: "", pincode: "" })
  }

  const hasSelection = Boolean(state || district || city || pincode)

  return (
    <div className="space-y-5">
      {/* Hidden inputs mirror the selection for native form submission. */}
      <input type="hidden" name="country" value={COUNTRY} />
      <input type="hidden" name="state" value={state} />
      <input type="hidden" name="district" value={district} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="pincode" value={pincode} />

      <LocationField label="Country" htmlFor="location-country">
        <Input
          id="location-country"
          value={COUNTRY}
          disabled
          readOnly
          aria-label="Country (fixed to India)"
          className="bg-muted/50 text-muted-foreground"
        />
      </LocationField>

      <div className="grid gap-5 sm:grid-cols-2">
        <LocationField label="State / Union Territory" htmlFor="location-state">
          <SelectCombobox
            id="location-state"
            value={state}
            onChange={handleState}
            options={states}
            loading={states.length === 0}
            placeholder="Select a state"
            searchPlaceholder="Search states…"
            emptyText="No state found."
          />
        </LocationField>

        <LocationField label="District" htmlFor="location-district">
          <SelectCombobox
            id="location-district"
            value={district}
            onChange={handleDistrict}
            options={districts}
            disabled={!state}
            loading={loadingDistricts}
            placeholder={state ? "Select a district" : "Select a state first"}
            searchPlaceholder="Search districts…"
            emptyText="No district found."
          />
        </LocationField>

        <LocationField label="City / Sub-district" htmlFor="location-city">
          <SelectCombobox
            id="location-city"
            value={city}
            onChange={handleCity}
            options={cities}
            disabled={!district}
            loading={loadingCities}
            placeholder={district ? "Select a city" : "Select a district first"}
            searchPlaceholder="Search cities…"
            emptyText="No city found."
          />
        </LocationField>

        <LocationField
          label="PIN Code"
          htmlFor="location-pincode"
          hint="Pick a known code or type a custom 6-digit PIN."
        >
          <CreatablePincode
            id="location-pincode"
            value={pincode}
            onChange={handlePincode}
            options={pincodes}
            disabled={!city}
            loading={loadingPincodes}
            placeholder={city ? "Select or type a PIN code" : "Select a city first"}
          />
        </LocationField>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetLocation}
          disabled={!hasSelection}
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            strokeWidth={2}
            className="size-3.5"
          />
          Reset Location
        </Button>
      </div>
    </div>
  )
}
