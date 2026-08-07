/**
 * `departments` entity — the civic departments that complaints are routed to
 * and that officers belong to. Mirrors the `departments` table in the diagram.
 */
export interface Department {
  id: number
  name: string
  description: string
  budget: number
  /**
   * The department head — an officer (users.id) who triages the department's
   * complaint queue and allots cases to officers. `null` until an admin
   * designates one.
   */
  headOfficerId: string | null
  /**
   * Display name of the head officer, resolved by the backend. Optional —
   * unset in mock data (which resolves names separately); populated when a
   * department comes from the API.
   */
  headOfficerName?: string | null
  createdAt: string
  updatedAt: string
}
