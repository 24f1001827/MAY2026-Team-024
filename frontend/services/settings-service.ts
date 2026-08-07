/**
 * services/settings-service.ts
 *
 * Organization-wide settings. GET is readable by any authenticated user (the
 * department dashboard shows the allotment mode); PATCH is admin-only (enforced
 * by the backend).
 */

import { api } from "@/lib/api/api-client"
import type { AppSettings } from "@/types/settings"

/** Backend success envelope: `{ success, message, data }`. */
interface Envelope<T> {
  data: T
}

/** Raw settings row as the backend serializes it. */
interface RawSettings {
  manual_allotment: boolean
}

function normalize(raw: RawSettings): AppSettings {
  return { manualAllotment: raw.manual_allotment }
}

export const settingsService = {
  async get(): Promise<AppSettings> {
    const res = await api.get<Envelope<RawSettings>>("/settings")
    return normalize(res.data)
  },

  async update(manualAllotment: boolean): Promise<AppSettings> {
    const res = await api.patch<Envelope<RawSettings>>("/settings", {
      manual_allotment: manualAllotment,
    })
    return normalize(res.data)
  },
}
