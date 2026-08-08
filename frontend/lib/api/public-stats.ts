/**
 * lib/api/public-stats.ts
 *
 * Server-only fetch for the PUBLIC (unauthenticated) landing-page statistics.
 * Calls the Flask `GET /stats/public` endpoint directly (no auth). Resilient:
 * returns zeros on any failure so the page still renders (and `next build`
 * succeeds even if the backend is down). Never import from client code.
 */

import { apiUrl } from "@/lib/api/config"

export interface PublicStats {
  complaintsTotal: number
  resolvedPct: number
  tendersAwarded: number
  agenciesTotal: number
}

const EMPTY: PublicStats = {
  complaintsTotal: 0,
  resolvedPct: 0,
  tendersAwarded: 0,
  agenciesTotal: 0,
}

export async function fetchPublicStats(): Promise<PublicStats> {
  try {
    const res = await fetch(apiUrl("/stats/public"), { cache: "no-store" })
    if (!res.ok) return EMPTY
    const body = (await res.json()) as {
      data?: {
        complaints_total?: number
        resolved_pct?: number
        tenders_awarded?: number
        agencies_total?: number
      }
    }
    const d = body.data ?? {}
    return {
      complaintsTotal: Number(d.complaints_total ?? 0),
      resolvedPct: Number(d.resolved_pct ?? 0),
      tendersAwarded: Number(d.tenders_awarded ?? 0),
      agenciesTotal: Number(d.agencies_total ?? 0),
    }
  } catch {
    return EMPTY
  }
}
