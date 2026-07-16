import type { Citizen } from "@/types/user"

import { mockUsers } from "./users"

/** Dummy citizens — the subset of `mockUsers` whose role is "Citizen". */
export const mockCitizens: Citizen[] = mockUsers.filter(
  (user): user is Citizen => user.role === "Citizen"
)
