/**
 * services/admin-agency-service.ts
 *
 * Admin agency directory, via this app's `/api/admin/agencies*` route handlers
 * (Bearer forwarded server-side; backend is admin-only).
 *
 * Endpoints:
 *   GET /admin/agencies       → AdminAgencySchema[]  (list)
 *   GET /admin/agencies/{id}  → AdminAgencySchema     (detail)
 */

import { api } from "@/lib/api/api-client"
import { normalizeStatus } from "@/lib/utils/user/normalize"
import type { AdminAgency, WorkOrderStatus } from "@/types/agency"

/** A work order the agency is executing, as the admin detail shows it. */
export interface AdminAgencyWorkOrder {
  id: number
  tenderId: number
  scopeOfWork: string
  status: WorkOrderStatus
  startDate: string | null
  endDate: string | null
  createdAt: string
}

/** Backend success envelope: `{ success, message, data }`. */
interface Envelope<T> {
  data: T
}

interface RawAdminAgency {
  id: string
  name: string
  email: string
  phone?: string | null
  status: string
  registration_number: string
  license_number: string
  contact_person?: string | null
  current_projects?: number | null
  max_projects?: number | null
  created_at?: string | null
}

function toAdminAgency(raw: RawAdminAgency): AdminAgency {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone ?? "",
    // Accept enum name or value; fall back to PendingApproval if unknown.
    status: normalizeStatus(raw.status) ?? "PendingApproval",
    registrationNumber: raw.registration_number,
    licenseNumber: raw.license_number,
    contactPerson: raw.contact_person ?? "",
    currentProjects: raw.current_projects ?? 0,
    maxProjects: raw.max_projects ?? 0,
    createdAt: raw.created_at ?? "",
  }
}

export const adminAgencyService = {
  /** All agencies (admin directory). */
  async list(): Promise<AdminAgency[]> {
    const res = await api.get<Envelope<RawAdminAgency[]>>("/admin/agencies")
    return (res.data ?? []).map(toAdminAgency)
  },

  /** A single agency by id. */
  async get(id: string): Promise<AdminAgency> {
    const res = await api.get<Envelope<RawAdminAgency>>(`/admin/agencies/${id}`)
    return toAdminAgency(res.data)
  },

  /** Work orders the agency is executing. */
  async listWorkOrders(id: string): Promise<AdminAgencyWorkOrder[]> {
    const res = await api.get<
      Envelope<
        {
          id: number
          tender_id: number
          scope_of_work: string
          status: string
          start_date?: string | null
          end_date?: string | null
          created_at?: string | null
        }[]
      >
    >(`/admin/agencies/${id}/work-orders`)
    return (res.data ?? []).map((w) => ({
      id: w.id,
      tenderId: w.tender_id,
      scopeOfWork: w.scope_of_work,
      status: w.status as WorkOrderStatus,
      startDate: w.start_date ?? null,
      endDate: w.end_date ?? null,
      createdAt: w.created_at ?? "",
    }))
  },
}
