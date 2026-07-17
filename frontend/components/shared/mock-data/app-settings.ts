import type { AppSettings } from "@/types/settings"

/**
 * Dummy organization-wide settings. `manualAllotment` gates whether complaints
 * queue for a department head to allot, or are auto-assigned on arrival.
 */
export const mockAppSettings: AppSettings = {
  manualAllotment: true,
}
