import type { User } from "./user"

/**
 * A Citizen is a `user` whose `role` is "Citizen" (no separate table —
 * `complaints.citizen_id` etc. reference `users.id`). This narrows the `User`
 * type so citizen-only code paths get a precise role.
 */
export interface Citizen extends User {
  role: "Citizen"
}
