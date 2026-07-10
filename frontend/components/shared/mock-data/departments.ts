import type { Department } from "@/types/department"

/** Dummy civic departments. */
export const mockDepartments: Department[] = [
  {
    id: 1,
    name: "Public Works",
    description: "Roads, drainage, footpaths, and public infrastructure.",
    budget: 25000000,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: 2,
    name: "Water Supply",
    description: "Pipeline maintenance, leakages, and water quality issues.",
    budget: 18000000,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-05-12T10:00:00.000Z",
  },
  {
    id: 3,
    name: "Sanitation",
    description: "Waste collection, sewage, and public cleanliness.",
    budget: 14500000,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-06-18T10:00:00.000Z",
  },
  {
    id: 4,
    name: "Street Lighting",
    description: "Installation and repair of public lighting.",
    budget: 6200000,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-04-30T10:00:00.000Z",
  },
]
