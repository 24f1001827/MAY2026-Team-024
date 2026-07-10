/**
 * `departments` entity — the civic departments that complaints are routed to
 * and that officers belong to. Mirrors the `departments` table in the diagram.
 */
export interface Department {
  id: number
  name: string
  description: string
  budget: number
  createdAt: string
  updatedAt: string
}
