"use client"

import { useEffect } from "react"
import Link from "next/link"
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, MapPinIcon } from "@hugeicons/core-free-icons"

import {
  PRIORITY_META,
  statusBadgeClass,
  statusLabel,
} from "@/lib/utils/complaint/display"
import { cn } from "@/lib/utils"
import type { ComplaintMapItem } from "../../dashboard/components/types"

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
// "DEMO_MAP_ID" is Google's public map id for AdvancedMarker examples; swap for
// a real, styled map id via env when available.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID"

// Kochi — where the sample complaints are clustered.
const DEFAULT_CENTER = { lat: 9.9535, lng: 76.2673 }
const DEFAULT_ZOOM = 12

type Coords = { lat: number; lng: number }

function coordsOf(c: ComplaintMapItem): Coords | null {
  if (c.latitude == null || c.longitude == null) return null
  return { lat: c.latitude, lng: c.longitude }
}

/** Pans the map to the selected complaint whenever the selection changes. */
function MapPanner({ target }: { target: Coords | null }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !target) return
    map.panTo(target)
    if ((map.getZoom() ?? 0) < 14) map.setZoom(14)
  }, [map, target])
  return null
}

type ComplaintsMapProps = {
  complaints: ComplaintMapItem[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  colorScheme: "LIGHT" | "DARK"
  detailHref: (id: string) => string
}

export function ComplaintsMap({
  complaints,
  selectedId,
  onSelect,
  colorScheme,
  detailHref,
}: ComplaintsMapProps) {
  if (!API_KEY) {
    return <MapKeyMissing />
  }

  const selected = complaints.find((c) => c.id === selectedId) ?? null
  const target = selected ? coordsOf(selected) : null

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        mapId={MAP_ID}
        colorScheme={colorScheme}
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI
        clickableIcons={false}
        reuseMaps
        className="size-full"
        onClick={() => onSelect(null)}
      >
        {complaints.map((complaint) => {
          const coords = coordsOf(complaint)
          if (!coords) return null
          const active = complaint.id === selectedId
          const meta = PRIORITY_META[complaint.priority]
          return (
            <AdvancedMarker
              key={complaint.id}
              position={coords}
              zIndex={active ? 20 : 1}
              onClick={() => onSelect(complaint.id)}
              title={complaint.title}
            >
              <Pin
                background={meta.pin}
                borderColor={meta.pinBorder}
                glyphColor="#ffffff"
                scale={active ? 1.5 : 1}
              />
            </AdvancedMarker>
          )
        })}

        {selected && target && (
          <InfoWindow
            position={target}
            onCloseClick={() => onSelect(null)}
            headerDisabled
          >
            <ComplaintInfo complaint={selected} detailHref={detailHref} />
          </InfoWindow>
        )}

        <MapPanner target={target} />
      </Map>
    </APIProvider>
  )
}

// ---------------------------------------------------------------------------
// Info window content — rendered inside Google's white popup, so it uses fixed
// (theme-independent) colors.
// ---------------------------------------------------------------------------

function ComplaintInfo({
  complaint,
  detailHref,
}: {
  complaint: ComplaintMapItem
  detailHref: (id: string) => string
}) {
  return (
    <div className="w-56 font-sans">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
            statusBadgeClass(complaint.status)
          )}
        >
          {statusLabel(complaint.status)}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
          <span
            className={cn(
              "size-1.5 rounded-full",
              PRIORITY_META[complaint.priority].dot
            )}
          />
          {PRIORITY_META[complaint.priority].label}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-gray-900">
        {complaint.title}
      </p>
      <p className="mt-1 text-xs leading-snug text-gray-500">
        {complaint.address}, {complaint.locality}
      </p>
      <Link
        href={detailHref(complaint.id)}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
      >
        View details
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Fallback when no API key is configured
// ---------------------------------------------------------------------------

function MapKeyMissing() {
  return (
    <div className="grid size-full place-items-center bg-muted/40 p-6">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand">
          <HugeiconsIcon icon={MapPinIcon} />
        </span>
        <p className="mt-4 text-sm font-semibold text-foreground">
          Map unavailable
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Set{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </code>{" "}
          in your <code className="text-xs">.env.local</code> to load the
          complaints map. The list on the left still works.
        </p>
      </div>
    </div>
  )
}
