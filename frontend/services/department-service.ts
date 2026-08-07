/**
 * services/department-service.ts
 *
 * Department service. Uses the shared `api` client to call this app's route
 * handlers, which forward the caller's Bearer token to Flask.
 *
 * Endpoints:
 *   GET    /api/departments/public              → DepartmentOption[]  (no auth)
 *   GET    /api/admin/departments               → Department[]        (admin)
 *   GET    /api/admin/departments/{id}          → Department          (admin)
 *   POST   /api/admin/departments               → Department          (admin)
 *   PATCH  /api/admin/departments/{id}          → Department          (admin)
 *   DELETE /api/admin/departments/{id}          → void                (admin)
 */

import { api } from "@/lib/api/api-client"
import {
  normalizeDepartment,
  type RawDepartment,
} from "@/lib/utils/department/normalize"
import type {
  CreateDepartmentInput,
  Department,
  DepartmentOption,
  UpdateDepartmentInput,
} from "@/types/department"

/** Backend success envelope: `{ success, message, data }`. */
interface Envelope<T> {
  data: T
}

export const departmentService = {
  /** Public list of departments (id + name) — no auth required. */
  async listPublic(): Promise<DepartmentOption[]> {
    const res = await api.get<Envelope<DepartmentOption[]>>(
      "/departments/public",
    )
    return res.data ?? []
  },

  /** Admin: all departments (full records, incl. head officer name). */
  async list(): Promise<Department[]> {
    const res = await api.get<Envelope<RawDepartment[]>>("/admin/departments")
    return (res.data ?? []).map(normalizeDepartment)
  },

  /** Admin: a single department by id. */
  async getById(id: number): Promise<Department> {
    const res = await api.get<Envelope<RawDepartment>>(
      `/admin/departments/${id}`,
    )
    return normalizeDepartment(res.data)
  },

  /** Admin: create a department. */
  async create(input: CreateDepartmentInput): Promise<Department> {
    const res = await api.post<Envelope<RawDepartment>>(
      "/admin/departments",
      input,
    )
    return normalizeDepartment(res.data)
  },

  /** Admin: update a department (partial). */
  async update(id: number, input: UpdateDepartmentInput): Promise<Department> {
    const res = await api.patch<Envelope<RawDepartment>>(
      `/admin/departments/${id}`,
      input,
    )
    return normalizeDepartment(res.data)
  },

  /** Admin: soft-delete a department. */
  async remove(id: number): Promise<void> {
    await api.delete(`/admin/departments/${id}`)
  },
}
