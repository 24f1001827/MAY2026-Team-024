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
  createdAt: string
  updatedAt: string
}
