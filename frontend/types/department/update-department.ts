import type { CreateDepartmentInput } from "./create-department"

/**
 * Input for updating a department — all fields optional (partial update maps to
 * the backend `UpdateDepartmentSchema`). Pass `head_officer_id: null` to clear
 * the head.
 */
export type UpdateDepartmentInput = Partial<CreateDepartmentInput>
