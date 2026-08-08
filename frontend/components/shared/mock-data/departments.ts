import type { Department } from "@/types/department"

/** Dummy civic departments. */
export const mockDepartments: Department[] = [
  {
    id: 1,
    name: "Public Works",
    description: "Roads, drainage, footpaths, and public infrastructure.",
    budget: null,
    headOfficerId: "22222222-2222-4222-8222-222222222222", // Priya Nair
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: 2,
    name: "Water Supply",
    description: "Pipeline maintenance, leakages, and water quality issues.",
    budget: null,
    headOfficerId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-05-12T10:00:00.000Z",
  },
  {
    id: 3,
    name: "Sanitation",
    description: "Waste collection, sewage, and public cleanliness.",
    budget: null,
    headOfficerId: "33333333-3333-4333-8333-333333333333", // Rahul Verma
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-06-18T10:00:00.000Z",
  },
  {
    id: 4,
    name: "Street Lighting",
    description: "Installation and repair of public lighting.",
    budget: null,
    headOfficerId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-04-30T10:00:00.000Z",
  },
]
