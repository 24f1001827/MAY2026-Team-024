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
 * To swap the source later (a Route Handler, a real API, or a DB), keep these
 * four signatures and replace the body — the form only depends on the exports.
 */

import { createRequire } from "node:module"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"

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
} as const

/** Locale-aware, case-insensitive, numeric-aware name sort. */
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" })
const sortNames = (names: Iterable<string>): string[] =>
  [...names].sort((a, b) => collator.compare(a, b))

/** Cached across requests so the ~150k-row file is parsed at most once. */
let indexCache: LocationIndex | null = null

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

/** Builds (and memoizes) the State → District → City → PIN hierarchy. */
function getIndex(): LocationIndex {
  if (indexCache) return indexCache

  const raw = readFileSync(resolveDataFile(), "utf8")
  const index: LocationIndex = new Map()

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
  }

  indexCache = index
  return index
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
