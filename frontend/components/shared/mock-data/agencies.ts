import type { Agency } from "@/types/agency"

/**
 * Dummy agency profiles. `id` matches the "Agency" rows in `mockUsers`
 * (agencies share their primary key with the corresponding user).
 */
export const mockAgencies: Agency[] = [
  {
    id: "77777777-7777-4777-8777-777777777777", // BuildRight Infra Pvt Ltd
    registrationNumber: "REG-2021-BR-4471",
    licenseNumber: "LIC-INFRA-88201",
    contactPerson: "Karthik Reddy",
    currentProjects: 2,
    maxProjects: 5,
    deletedAt: null,
    createdAt: "2026-01-20T11:00:00.000Z",
    updatedAt: "2026-06-15T13:00:00.000Z",
  },
  {
    id: "88888888-8888-4888-8888-888888888888", // UrbanWorks Constructions
    registrationNumber: "REG-2023-UW-9920",
    licenseNumber: "LIC-INFRA-90455",
    contactPerson: "Anjali Deshpande",
    currentProjects: 0,
    maxProjects: 3,
    deletedAt: null,
    createdAt: "2026-05-30T15:20:00.000Z",
    updatedAt: "2026-05-30T15:20:00.000Z",
  },
]
