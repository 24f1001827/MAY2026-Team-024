/**
 * lib/utils/geo.ts
 *
 * Small geodesy helpers shared by the server-side location index and the
 * client-side complaint validator. Pure functions, no I/O — safe to import from
 * either side of the RPC boundary.
 */

/** A WGS-84 point in decimal degrees. */
export interface Coords {
  lat: number
  lng: number
}

/** Mean Earth radius in kilometres. */
const EARTH_RADIUS_KM = 6371

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180

/**
 * Great-circle distance between two points, in kilometres (haversine).
 * Accurate to well under a percent at the city/district scale we compare at.
 */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Squared euclidean distance in degrees — monotonic with true distance over a
 * small neighbourhood, so it can rank nearest-candidate rows without the cost
 * of a haversine per row. Longitude is scaled by cos(lat) so the comparison
 * stays fair away from the equator.
 */
export function approxDistanceSq(a: Coords, b: Coords): number {
  const dLat = b.lat - a.lat
  const dLng = (b.lng - a.lng) * Math.cos(toRadians((a.lat + b.lat) / 2))
  return dLat * dLat + dLng * dLng
}
