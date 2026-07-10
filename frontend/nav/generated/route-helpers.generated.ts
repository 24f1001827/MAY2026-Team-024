/**
 * nav/generated/route-helpers.generated.ts
 *
 * AUTO-GENERATED — do not edit by hand.
 * Run `bun routes:generate` to regenerate from the filesystem.
 *
 * Source: app/dashboard (scanned recursively)
 * Generated: 2026-07-10
 */

const BASE = '/dashboard';
const b = (path: string) => `${BASE}${path}`;

export const routes = {
  href: b(''),

  agencies: b('/agencies'),

  complaints: b('/complaints'),

  departments: b('/departments'),

  notifications: b('/notifications'),

  officers: b('/officers'),

  settings: b('/settings'),

  tenders: b('/tenders'),
} as const;

export type Routes = typeof routes;
