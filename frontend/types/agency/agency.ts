/**
 * `agencies` entity — a contractor profile that extends a `user` (role
 * "Agency"). `id` is the shared PK/FK to `users.id`. Tracks registration/
 * licensing and project capacity. Mirrors the `agencies` table in the diagram.
 */
export interface Agency {
  id: string // uuid — shared with users.id
  registrationNumber: string
  licenseNumber: string
  contactPerson: string
  currentProjects: number
  maxProjects: number
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}
