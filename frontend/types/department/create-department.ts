/**
 * Input for creating a department. Maps to the backend `CreateDepartmentSchema`
 * (snake_case `head_officer_id`). `budget` is sent as a number; the backend
 * accepts it into a Decimal field.
 */
export interface CreateDepartmentRequest {
  name: string
  description?: string
  budget?: number
  /** User id of the head officer, or null/omitted for none. */
  head_officer_id?: string | null
}
