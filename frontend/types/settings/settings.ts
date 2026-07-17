/**
 * `AppSettings` — organization-wide preferences an admin controls from the
 * Settings page. Mirrors a future `app_settings` singleton row.
 */
export interface AppSettings {
  /**
   * When `true`, complaints routed to a department wait in an unassigned queue
   * for the department head to allot manually. When `false`, complaints are
   * auto-assigned to the least-loaded officer in the department.
   */
  manualAllotment: boolean
}
