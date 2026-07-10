import type { Role } from "@/types/user"

/** Dummy role descriptors for the four `UserRole` values. */
export const mockRoles: Role[] = [
  {
    key: "Citizen",
    label: "Citizen",
    description:
      "Files complaints, uploads evidence, and tracks resolution progress.",
  },
  {
    key: "Officer",
    label: "Department Officer",
    description:
      "Reviews assigned complaints, inspects sites, and submits review reports.",
  },
  {
    key: "Admin",
    label: "Administrator",
    description:
      "Manages users, departments, budgets, tenders, and overall workflow.",
  },
  {
    key: "Agency",
    label: "Contractor Agency",
    description:
      "Submits proposals to tenders and executes awarded work orders.",
  },
]
