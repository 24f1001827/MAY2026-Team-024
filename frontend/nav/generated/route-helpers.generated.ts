/**
 * nav/generated/route-helpers.generated.ts
 *
 * AUTO-GENERATED — do not edit by hand.
 * Run `bun routes:generate` to regenerate from the filesystem.
 *
 * Source: app/dashboard (scanned recursively)
 * Generated: 2026-08-09
 */

const BASE = '/dashboard';
const b = (path: string) => `${BASE}${path}`;

export const routes = {
  href: b(''),

  agencies: {
    href: b('/agencies'),
    detail: (id: string | number) => ({ href: b(`/agencies/${id}`) }),
  },

  blocked: b('/blocked'),

  budgets: {
    href: b('/budgets'),
    detail: (id: string | number) => ({ href: b(`/budgets/${id}`) }),
  },

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

  officers: b('/officers'),

  pendingApprovals: b('/pending-approvals'),

  proposals: b('/proposals'),

  rejected: b('/rejected'),

  settings: b('/settings'),

  tenders: {
    href: b('/tenders'),
    detail: (id: string | number) => ({ href: b(`/tenders/${id}`) }),
  },

  workOrders: {
    href: b('/work-orders'),
    detail: (id: string | number) => ({ href: b(`/work-orders/${id}`) }),
  },
} as const;

export type Routes = typeof routes;
