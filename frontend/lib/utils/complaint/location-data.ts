"use server"

/**
 * India location data helpers backing the cascading complaint location form.
 *
 * These run as **Server Actions** (`"use server"`), so the heavy postal dataset
 * (`postalcodes-india`, ~150k rows / tens of MB) is parsed and indexed on the
 * server and never enters the client bundle. The client comboboxes call these
 * over RPC as the user drills down State → District → City → PIN.
 *
 * The `postalcodes-india` public API only enumerates states and does pincode→
 * location lookups — it cannot enumerate districts/cities for a state. So we
 * read its shipped GeoNames export (`data/IN.txt`, tab-separated) once, build an
 * in-memory hierarchy, and cache it for the life of the server process.
 *
 * Every row also carries a latitude/longitude, so the same dataset answers both
 * directions of the address↔map reconciliation: `getCentroid` turns a chosen
 * address into a map centre, and `resolveCoordinates` turns a dropped pin back
 * into an address. No geocoding API — and no API key — involved.
 *
 * To swap the source later (a Route Handler, a real API, or a DB), keep these
 * signatures and replace the body — the form only depends on the exports.
 */

import { createRequire } from "node:module"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"

import { approxDistanceSq, distanceKm, type Coords } from "@/lib/utils/geo"

/** state name → district name → city (sub-district) name → set of PIN codes. */
type LocationIndex = Map<string, Map<string, Map<string, Set<string>>>>

/**
 * GeoNames `IN.txt` columns (tab-separated):
 * 0 country · 1 postalCode · 2 placeName · 3 stateName · 4 stateCode ·
 * 5 districtName · 6 districtCode · 7 subDistrictName · 8 communityCode ·
 * 9 latitude · 10 longitude · 11 accuracy
 */
const COL = {
  postalCode: 1,
  placeName: 2,
  stateName: 3,
  districtName: 5,
  subDistrictName: 7,
  latitude: 9,
  longitude: 10,
} as const

/** Locale-aware, case-insensitive, numeric-aware name sort. */
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" })
const sortNames = (names: Iterable<string>): string[] =>
  [...names].sort((a, b) => collator.compare(a, b))

/** One postal row, with the coordinates GeoNames ships alongside it. */
interface PlaceRow {
  pin: string
  place: string
  state: string
  district: string
  city: string
  lat: number
  lng: number
}

/** The averaged position of an address path, plus how far it spreads. */
interface Centroid extends Coords {
  /** Distance from the centre to the farthest row under this path, in km. */
  radiusKm: number
}

/** Everything derived from a single parse of `IN.txt`. */
interface LocationData {
  index: LocationIndex
  rows: PlaceRow[]
  /** `${latCell}:${lngCell}` → indices into `rows`, for nearest-row lookups. */
  grid: Map<string, number[]>
  /** Address path key (see `pathKey`) → its centroid. */
  centroids: Map<string, Centroid>
}

/** Cached across requests so the ~150k-row file is parsed at most once. */
let dataCache: LocationData | null = null

/** Grid cell size in degrees (~55 km) for the reverse lookup. */
const CELL = 0.5

/** Rough degrees→km factor, good enough for a tolerance radius. */
const KM_PER_DEGREE = 111.32

const cellKey = (lat: number, lng: number): string =>
  `${Math.floor(lat / CELL)}:${Math.floor(lng / CELL)}`

/** How specific an address path is — coarsest to finest. */
export type LocationLevel = "state" | "district" | "city" | "pin"

/**
 * Key for an address path. The level is part of the key so a state that shares
 * a name with one of its districts (Delhi, Goa, Puducherry…) can't collide, and
 * segments are joined on "|" — no name in the dataset contains a pipe.
 */
const pathKey = (level: LocationLevel, ...parts: string[]): string =>
  [level, ...parts].join("|")

/**
 * Locates the bundled `data/IN.txt`. Tries the project's `node_modules` first
 * (reliable in the Next server runtime), then package resolution. We check each
 * candidate with `existsSync` and return the first real path — under Turbopack
 * `import.meta.url` is a virtual `[project]/…` path, so `require.resolve` can
 * hand back a non-existent path that would otherwise fail later at read time.
 */
function resolveDataFile(): string {
  const candidates = [
    join(process.cwd(), "node_modules", "postalcodes-india", "data", "IN.txt"),
  ]

  try {
    // Package `exports` only maps the entry, so resolve that and walk to /data.
    const entry = createRequire(import.meta.url).resolve("postalcodes-india")
    candidates.push(join(dirname(entry), "..", "data", "IN.txt"))
  } catch {
    // createRequire/import.meta may be unavailable under some bundlers — ignore.
  }

  const found = candidates.find((path) => existsSync(path))
  if (!found) {
    throw new Error(
      `postalcodes-india data file (IN.txt) not found. Looked in:\n${candidates.join("\n")}`
    )
  }
  return found
}

/** Running sum used to average a path's coordinates in a single pass. */
interface Accumulator {
  latSum: number
  lngSum: number
  count: number
}

/** Every path key a row belongs to, coarsest to finest. */
function keysFor(row: PlaceRow): string[] {
  return [
    pathKey("state", row.state),
    pathKey("district", row.state, row.district),
    pathKey("city", row.state, row.district, row.city),
    pathKey("pin", row.pin),
  ]
}

/**
 * Parses `IN.txt` once and derives everything the form needs from it: the
 * cascade hierarchy, a flat row list, a coarse spatial grid for reverse
 * lookups, and a centroid (with spread radius) per address path.
 *
 * State/district/city/PIN strings are interned — there are only ~35 states and
 * ~19k PINs across 155k rows, so sharing the instances keeps the row list from
 * dominating the server's heap.
 */
function build(): LocationData {
  const raw = readFileSync(resolveDataFile(), "utf8")

  const index: LocationIndex = new Map()
  const rows: PlaceRow[] = []
  const grid = new Map<string, number[]>()
  const sums = new Map<string, Accumulator>()

  const pool = new Map<string, string>()
  const intern = (value: string): string => {
    const existing = pool.get(value)
    if (existing !== undefined) return existing
    pool.set(value, value)
    return value
  }

  for (const line of raw.split("\n")) {
    if (!line) continue
    const cols = line.split("\t")

    const pin = cols[COL.postalCode]
    const state = cols[COL.stateName]
    const district = cols[COL.districtName]
    // Fall back to the place/locality when a sub-district is missing.
    const city = cols[COL.subDistrictName] || cols[COL.placeName]
    if (!pin || !state || !district || !city) continue

    let districts = index.get(state)
    if (!districts) index.set(state, (districts = new Map()))

    let cities = districts.get(district)
    if (!cities) districts.set(district, (cities = new Map()))

    let pins = cities.get(city)
    if (!pins) cities.set(city, (pins = new Set()))

    pins.add(pin)

    // Rows without usable coordinates still belong in the cascade above; they
    // just can't take part in the geo reconciliation.
    const lat = Number(cols[COL.latitude])
    const lng = Number(cols[COL.longitude])
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    const row: PlaceRow = {
      pin: intern(pin),
      place: cols[COL.placeName] ?? "",
      state: intern(state),
      district: intern(district),
      city: intern(city),
      lat,
      lng,
    }
    const position = rows.push(row) - 1

    const cell = cellKey(lat, lng)
    const bucket = grid.get(cell)
    if (bucket) bucket.push(position)
    else grid.set(cell, [position])

    for (const key of keysFor(row)) {
      const sum = sums.get(key)
      if (sum) {
        sum.latSum += lat
        sum.lngSum += lng
        sum.count += 1
      } else {
        sums.set(key, { latSum: lat, lngSum: lng, count: 1 })
      }
    }
  }

  // Averages first, then a second pass for each path's spread. The radius is
  // what makes "is this pin plausibly in that city?" answerable per-place
  // instead of against one arbitrary global threshold.
  const centroids = new Map<string, Centroid>()
  for (const [key, sum] of sums) {
    centroids.set(key, {
      lat: sum.latSum / sum.count,
      lng: sum.lngSum / sum.count,
      radiusKm: 0,
    })
  }

  for (const row of rows) {
    for (const key of keysFor(row)) {
      const centroid = centroids.get(key)
      if (!centroid) continue
      const spread = Math.sqrt(approxDistanceSq(centroid, row)) * KM_PER_DEGREE
      if (spread > centroid.radiusKm) centroid.radiusKm = spread
    }
  }

  return { index, rows, grid, centroids }
}

/** Builds (and memoizes) everything derived from the postal dataset. */
function getData(): LocationData {
  if (!dataCache) dataCache = build()
  return dataCache
}

/** The State → District → City → PIN hierarchy backing the cascade. */
function getIndex(): LocationIndex {
  return getData().index
}

/** All Indian states and union territories, alphabetized. */
export async function getStates(): Promise<string[]> {
  return sortNames(getIndex().keys())
}

/** Districts within `state` (empty if the state is unknown/blank). */
export async function getDistricts(state: string): Promise<string[]> {
  const districts = state ? getIndex().get(state) : undefined
  return districts ? sortNames(districts.keys()) : []
}

/** Cities / sub-districts within `state` › `district`. */
export async function getCities(
  state: string,
  district: string
): Promise<string[]> {
  const cities = state && district ? getIndex().get(state)?.get(district) : undefined
  return cities ? sortNames(cities.keys()) : []
}

/**
 * Known 6-digit PIN codes for a `state` › `district` › `city`.
 *
 * City names are not unique across districts, so this takes the full path
 * rather than a bare city (a deliberate widening of the spec's `getPincodes`).
 */
export async function getPincodes(
  state: string,
  district: string,
  city: string
): Promise<string[]> {
  const pins =
    state && district && city
      ? getIndex().get(state)?.get(district)?.get(city)
      : undefined
  return pins ? [...pins].sort() : []
}

// ---------------------------------------------------------------------------
// Address ↔ coordinates. Both directions read the same parsed dataset, so the
// map and the address cascade can be kept consistent without a geocoding API.
// ---------------------------------------------------------------------------

/** A resolved map position for an address, ready to centre a map on. */
export interface AddressCentroid extends Coords {
  /** How specific the address was — the finest level that matched. */
  level: LocationLevel
  /** Distance from the centre to the farthest place under this address. */
  radiusKm: number
  /** A sensible map zoom for that spread. */
  zoom: number
}

/** Map zoom per address precision, from "whole state" to "one PIN". */
const ZOOM_FOR: Record<LocationLevel, number> = {
  state: 7,
  district: 10,
  city: 12,
  pin: 14,
}

/**
 * Centre point for the most specific part of an address that we can place.
 *
 * Tries PIN → city → district → state and returns the first hit, so a partly
 * filled cascade still moves the map somewhere useful. Returns null when
 * nothing matches (e.g. a custom PIN that isn't in the dataset and no other
 * field chosen yet).
 */
export async function getCentroid(address: {
  state?: string
  district?: string
  city?: string
  pincode?: string
}): Promise<AddressCentroid | null> {
  const { centroids } = getData()
  const { state, district, city, pincode } = address

  const candidates: Array<[LocationLevel, string | null]> = [
    ["pin", pincode ? pathKey("pin", pincode) : null],
    [
      "city",
      state && district && city ? pathKey("city", state, district, city) : null,
    ],
    ["district", state && district ? pathKey("district", state, district) : null],
    ["state", state ? pathKey("state", state) : null],
  ]

  for (const [level, key] of candidates) {
    const centroid = key ? centroids.get(key) : undefined
    if (!centroid) continue
    return {
      lat: centroid.lat,
      lng: centroid.lng,
      level,
      radiusKm: centroid.radiusKm,
      zoom: ZOOM_FOR[level],
    }
  }

  return null
}

/** The address a dropped pin most likely refers to. */
export interface ResolvedLocation {
  state: string
  district: string
  city: string
  pincode: string
  /** The specific locality the match came from, for display. */
  place: string
  /** How far the pin sits from that locality's recorded position, in km. */
  distanceKm: number
}

/** Grid rings to widen through before giving up (0.5° each, ~55 km). */
const MAX_SEARCH_RINGS = 4

/**
 * Reverse lookup: the nearest known place to a coordinate, as a full address.
 *
 * Scans the pin's own grid cell first and widens by one ring at a time, so a
 * typical lookup compares a few hundred rows rather than all 155k. A ring is
 * searched one step beyond the first hit, because a nearer row can sit just
 * across a cell boundary.
 */
export async function resolveCoordinates(
  lat: number,
  lng: number
): Promise<ResolvedLocation | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const { rows, grid } = getData()
  const target: Coords = { lat, lng }
  const centreLat = Math.floor(lat / CELL)
  const centreLng = Math.floor(lng / CELL)

  let best: PlaceRow | null = null
  let bestDistance = Infinity
  let hitRing = -1

  for (let ring = 0; ring <= MAX_SEARCH_RINGS; ring += 1) {
    for (let dLat = -ring; dLat <= ring; dLat += 1) {
      for (let dLng = -ring; dLng <= ring; dLng += 1) {
        // Only the newly added edge of the ring; the interior was covered.
        if (ring > 0 && Math.abs(dLat) !== ring && Math.abs(dLng) !== ring) {
          continue
        }
        const bucket = grid.get(`${centreLat + dLat}:${centreLng + dLng}`)
        if (!bucket) continue

        for (const position of bucket) {
          const row = rows[position]
          const distance = approxDistanceSq(target, row)
          if (distance < bestDistance) {
            bestDistance = distance
            best = row
            if (hitRing === -1) hitRing = ring
          }
        }
      }
    }
    // Search one ring past the first hit — a nearer row can sit just across a
    // cell boundary — then stop.
    if (hitRing !== -1 && ring > hitRing) break
  }

  if (!best) return null

  return {
    state: best.state,
    district: best.district,
    city: best.city,
    pincode: best.pin,
    place: best.place,
    distanceKm: distanceKm(target, best),
  }
}
