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
export const COUNTRY = "India"

export interface LocationValue {
  country: string
  state: string
  district: string
  city: string
  pincode: string
}

/** A blank address, for initial state and resets. */
export const EMPTY_LOCATION: LocationValue = {
  country: COUNTRY,
  state: "",
  district: "",
  city: "",
  pincode: "",
}

export interface IndiaIssueLocationFormProps {
  /** The current address. Controlled — the parent owns this state. */
  value: LocationValue
  /** Fires with the full next address on every field change. */
  onChange: (value: LocationValue) => void
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
 * An option list together with the address path it was fetched for. Pairing the
 * two makes "still loading" a derived value (`fetchedFor !== currentPath`)
 * rather than a flag every handler has to remember to raise — which matters now
 * that the address can also change from outside, when the map pin resolves to
 * one.
 */
interface Options {
  fetchedFor: string
  items: string[]
}

/** Sentinel path no real selection can produce, so nothing reads as fetched. */
const NOT_FETCHED: Options = { fetchedFor: "<none>", items: [] }

/**
 * Cascading India address picker: Country (fixed) → State → District →
 * City/Sub-district → PIN code. Each level unlocks the next and resets every
 * downstream field. Option lists load lazily from server actions so the postal
 * dataset stays off the client. Renders hidden inputs (`country`, `state`,
 * `district`, `city`, `pincode`) so it still submits with a native form.
 *
 * Fully controlled: the parent owns the address so the map picker can push a
 * reverse-geocoded one in. See `ComplaintForm` for that reconciliation.
 */
export function IndiaIssueLocationForm({
  value,
  onChange,
}: IndiaIssueLocationFormProps) {
  const { state, district, city, pincode } = value

  const [states, setStates] = useState<string[]>([])
  const [districts, setDistricts] = useState<Options>(NOT_FETCHED)
  const [cities, setCities] = useState<Options>(NOT_FETCHED)
  const [pincodes, setPincodes] = useState<Options>(NOT_FETCHED)

  // Paths each option list belongs to; a mismatch means "still loading".
  const districtPath = state
  const cityPath = state && district ? `${state}|${district}` : ""
  const pinPath = state && district && city ? `${state}|${district}|${city}` : ""

  // Each level fetches its children whenever its path changes. Results are
  // stamped with the path they were fetched for, so a slow response for an
  // abandoned path can never be mistaken for the current one's options.
  useEffect(() => {
    let active = true
    getStates()
      .then((next) => active && setStates(next))
      .catch(() => active && setStates([]))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!districtPath) return
    let active = true
    getDistricts(state)
      .then(
        (items) => active && setDistricts({ fetchedFor: districtPath, items })
      )
      .catch(
        () => active && setDistricts({ fetchedFor: districtPath, items: [] })
      )
    return () => {
      active = false
    }
  }, [districtPath, state])

  useEffect(() => {
    if (!cityPath) return
    let active = true
    getCities(state, district)
      .then((items) => active && setCities({ fetchedFor: cityPath, items }))
      .catch(() => active && setCities({ fetchedFor: cityPath, items: [] }))
    return () => {
      active = false
    }
  }, [cityPath, state, district])

  useEffect(() => {
    if (!pinPath) return
    let active = true
    getPincodes(state, district, city)
      .then((items) => active && setPincodes({ fetchedFor: pinPath, items }))
      .catch(() => active && setPincodes({ fetchedFor: pinPath, items: [] }))
    return () => {
      active = false
    }
  }, [pinPath, state, district, city])

  const loadingDistricts = Boolean(districtPath) && districts.fetchedFor !== districtPath
  const loadingCities = Boolean(cityPath) && cities.fetchedFor !== cityPath
  const loadingPincodes = Boolean(pinPath) && pincodes.fetchedFor !== pinPath

  // Choosing a level clears everything below it — a district from another state
  // would be nonsense.
  const handleState = (next: string) =>
    onChange({ ...EMPTY_LOCATION, state: next })

  const handleDistrict = (next: string) =>
    onChange({ ...EMPTY_LOCATION, state, district: next })

  const handleCity = (next: string) =>
    onChange({ ...EMPTY_LOCATION, state, district, city: next })

  const handlePincode = (next: string) =>
    onChange({ country: COUNTRY, state, district, city, pincode: next })

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
            options={districts.items}
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
            options={cities.items}
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
            options={pincodes.items}
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
          onClick={() => onChange(EMPTY_LOCATION)}
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
