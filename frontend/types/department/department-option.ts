/**
 * Minimal department shape exposed by the public (unauthenticated) list
 * endpoint — just what the officer registration dropdown needs. The backend's
 * `GET /departments/public` returns only id + name (no budget/description).
 */
export interface DepartmentOption {
  id: number
  name: string
}
