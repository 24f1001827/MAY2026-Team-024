/**
 * Input for creating a department. Maps to the backend `CreateDepartmentSchema`
 * (snake_case `head_officer_id`). Budget is NOT set here — department funding is
 * managed year-wise from the Budgets module.
 */
export interface CreateDepartmentRequest {
  name: string
  description?: string
  /** User id of the head officer, or null/omitted for none. */
  head_officer_id?: string | null
}
