"use client"

import { useCallback, useEffect, useState } from "react"
import {
  APIProvider,
  AdvancedMarker,
  Map,
  useMap,
} from "@vis.gl/react-google-maps"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Gps01Icon, Location01Icon, MapPinIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { Input } from "@/components/shadcn/input"
import { Label } from "@/components/shadcn/label"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/shadcn/drawer"

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
// "DEMO_MAP_ID" is Google's public map id for AdvancedMarker examples; swap for
// a real, styled map id via env when available.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID"

// Kochi — where the sample complaints are clustered; used until GPS or a manual
// pin gives us a real position.
const DEFAULT_CENTER = { lat: 9.9535, lng: 76.2673 }

type Coords = { lat: number; lng: number }

type GpsStatus = "locating" | "denied" | "unsupported" | "located"

const GEO_OPTS: PositionOptions = { enableHighAccuracy: true, timeout: 10000 }

function hasGeolocation(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator
}

/**
 * Right-column geo control for the complaint form: manual latitude/longitude
 * inputs plus a "Get current location" button that opens a bottom draggable
 * drawer with a map. The drawer tries GPS first and otherwise lets the citizen
 * tap/drag a pin to mark the exact spot.
 */
export function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null
  lng: number | null
  onChange: (lat: number | null, lng: number | null) => void
}) {
  const [open, setOpen] = useState(false)

  const initial = lat != null && lng != null ? { lat, lng } : null

  function parse(value: string): number | null {
    if (value.trim() === "") return null
    const n = Number(value)
    return Number.isNaN(n) ? null : n
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="latitude">Latitude</Label>
        <Input
          id="latitude"
          name="latitude"
          type="number"
          step="any"
          inputMode="decimal"
          value={lat ?? ""}
          onChange={(e) => onChange(parse(e.target.value), lng)}
          placeholder="9.9535"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="longitude">Longitude</Label>
        <Input
          id="longitude"
          name="longitude"
          type="number"
          step="any"
          inputMode="decimal"
          value={lng ?? ""}
          onChange={(e) => onChange(lat, parse(e.target.value))}
          placeholder="76.2673"
        />
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button type="button" variant="outline" className="w-full">
            <HugeiconsIcon icon={Location01Icon} className="mr-2 size-4" />
            Get current location
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          {open && (
            <LocationDrawerBody
              initial={initial}
              onConfirm={(c) => {
                onChange(c.lat, c.lng)
                setOpen(false)
              }}
            />
          )}
        </DrawerContent>
      </Drawer>

      {initial == null && (
        <p className="text-xs text-muted-foreground">
          No coordinates yet. Use “Get current location” to detect via GPS or
          mark the spot on the map.
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Drawer body — only mounted while the drawer is open, so the Maps JS API is
// loaded lazily (and re-checked for GPS) on demand.
// ---------------------------------------------------------------------------

function LocationDrawerBody({
  initial,
  onConfirm,
}: {
  initial: Coords | null
  onConfirm: (coords: Coords) => void
}) {
  const { resolvedTheme } = useTheme()
  const [draft, setDraft] = useState<Coords | null>(initial)
  // Where the map should pan to. Set on GPS fixes and initial mount only, so a
  // manual tap/drag moves the pin without the map jumping back under the user.
  const [flyTo, setFlyTo] = useState<Coords | null>(initial)
  // Lazily reflect what we'll do on mount so the auto-locate effect never has to
  // set state synchronously (it only updates via the async GPS callbacks).
  const [status, setStatus] = useState<GpsStatus>(() => {
    if (initial) return "located"
    return hasGeolocation() ? "locating" : "unsupported"
  })

  const applyFix = useCallback((pos: GeolocationPosition) => {
    const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    setDraft(next)
    setFlyTo(next)
    setStatus("located")
  }, [])

  // Manual retry from the "Use GPS" button — an event handler, so setting the
  // "locating" state up front is fine here.
  const locate = useCallback(() => {
    if (!hasGeolocation()) {
      setStatus("unsupported")
      return
    }
    setStatus("locating")
    navigator.geolocation.getCurrentPosition(applyFix, () => setStatus("denied"), GEO_OPTS)
  }, [applyFix])

  // Auto-try GPS on open unless the form already has coordinates to edit. Only
  // the async callbacks touch state, so no synchronous set-state-in-effect.
  useEffect(() => {
    if (initial || !hasGeolocation()) return
    navigator.geolocation.getCurrentPosition(applyFix, () => setStatus("denied"), GEO_OPTS)
  }, [initial, applyFix])

  if (!API_KEY) {
    return <MapKeyMissing />
  }

  const message =
    status === "locating"
      ? "Detecting your location via GPS…"
      : status === "denied"
        ? "Couldn’t access GPS. Tap the map to mark the location."
        : status === "unsupported"
          ? "GPS isn’t available here. Tap the map to mark the location."
          : "Tap the map or drag the pin to set the exact spot."

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Set complaint location</DrawerTitle>
        <DrawerDescription>{message}</DrawerDescription>
      </DrawerHeader>

      <div className="px-4">
        <div className="h-[45vh] w-full overflow-hidden rounded-xl border border-border">
          <APIProvider apiKey={API_KEY}>
            <Map
              mapId={MAP_ID}
              colorScheme={resolvedTheme === "dark" ? "DARK" : "LIGHT"}
              defaultCenter={draft ?? DEFAULT_CENTER}
              defaultZoom={draft ? 15 : 12}
              gestureHandling="greedy"
              disableDefaultUI
              clickableIcons={false}
              reuseMaps
              className="size-full"
              onClick={(e) => {
                if (e.detail.latLng) {
                  setDraft({
                    lat: e.detail.latLng.lat,
                    lng: e.detail.latLng.lng,
                  })
                }
              }}
            >
              {draft && (
                <AdvancedMarker
                  position={draft}
                  draggable
                  onDragEnd={(e) => {
                    if (e.latLng) {
                      setDraft({ lat: e.latLng.lat(), lng: e.latLng.lng() })
                    }
                  }}
                />
              )}
              <MapPanner target={flyTo} />
            </Map>
          </APIProvider>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          {draft
            ? `${draft.lat.toFixed(6)}, ${draft.lng.toFixed(6)}`
            : "No pin placed yet"}
        </p>
      </div>

      <DrawerFooter className="flex-row items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={locate}
          disabled={status === "locating"}
        >
          <HugeiconsIcon icon={Gps01Icon} className="mr-2 size-4" />
          {status === "locating" ? "Locating…" : "Use GPS"}
        </Button>
        <DrawerClose asChild>
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </DrawerClose>
        <Button
          type="button"
          variant="brand"
          className="ml-auto"
          disabled={!draft}
          onClick={() => draft && onConfirm(draft)}
        >
          Use this location
        </Button>
      </DrawerFooter>
    </>
  )
}

/** Pans the map to a GPS fix (or the initial pin) whenever it changes. */
function MapPanner({ target }: { target: Coords | null }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !target) return
    map.panTo(target)
    if ((map.getZoom() ?? 0) < 15) map.setZoom(15)
  }, [map, target])
  return null
}

function MapKeyMissing() {
  return (
    <div className="p-6">
      <div className="grid place-items-center rounded-xl bg-muted/40 p-8 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand">
          <HugeiconsIcon icon={MapPinIcon} />
        </span>
        <p className="mt-4 text-sm font-semibold text-foreground">
          Map unavailable
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Set{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </code>{" "}
          to pick a location on the map. You can still type the latitude and
          longitude manually.
        </p>
      </div>
    </div>
  )
}
