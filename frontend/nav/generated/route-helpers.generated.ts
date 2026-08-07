/**
 * nav/generated/route-helpers.generated.ts
 *
 * AUTO-GENERATED — do not edit by hand.
 * Run `bun routes:generate` to regenerate from the filesystem.
 *
 * Source: app/dashboard (scanned recursively)
 * Generated: 2026-08-02
 */

const BASE = '/dashboard';
const b = (path: string) => `${BASE}${path}`;

export const routes = {
  href: b(''),

  agencies: {
    href: b('/agencies'),
    create: b('/agencies/create'),
    detail: (id: string | number) => ({
      href: b(`/agencies/${id}`),
      edit: b(`/agencies/${id}/edit`),
    }),
  },

  blocked: b('/blocked'),

  complaints: {
    href: b('/complaints'),
    new: b('/complaints/new'),
    detail: (id: string | number) => ({
      href: b(`/complaints/${id}`),
      edit: b(`/complaints/${id}/edit`),
    }),
  },

  department: b('/department'),

  departments: {
    href: b('/departments'),
    create: b('/departments/create'),
    detail: (id: string | number) => ({
      href: b(`/departments/${id}`),
      edit: b(`/departments/${id}/edit`),
    }),
  },

  notifications: b('/notifications'),

  officers: {
    href: b('/officers'),
    create: b('/officers/create'),
    detail: (id: string | number) => ({
      href: b(`/officers/${id}`),
      edit: b(`/officers/${id}/edit`),
    }),
  },

  pendingApprovals: b('/pending-approvals'),

  rejected: b('/rejected'),

  settings: b('/settings'),

  tenders: {
    href: b('/tenders'),
    create: b('/tenders/create'),
    detail: (id: string | number) => ({
      href: b(`/tenders/${id}`),
      edit: b(`/tenders/${id}/edit`),
    }),
  },
} as const;

export type Routes = typeof routes;
