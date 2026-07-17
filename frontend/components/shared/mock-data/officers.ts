import type { Officer } from "@/types/officer"

/**
 * Dummy officer profiles. `userId` matches the "Officer" rows in `mockUsers`
 * and `departmentId` matches `mockDepartments`.
 */
export const mockOfficers: Officer[] = [
  {
    userId: "22222222-2222-4222-8222-222222222222", // Priya Nair
    departmentId: 1, // Public Works
    availabilityStatus: "Available",
    currentWorkload: 3,
    maxWorkload: 8,
    createdAt: "2026-01-10T08:15:00.000Z",
    updatedAt: "2026-06-20T14:45:00.000Z",
  },
  {
    userId: "33333333-3333-4333-8333-333333333333", // Rahul Verma
    departmentId: 3, // Sanitation
    availabilityStatus: "Engaged",
    currentWorkload: 7,
    maxWorkload: 8,
    createdAt: "2026-02-02T10:00:00.000Z",
    updatedAt: "2026-06-18T16:20:00.000Z",
  },
  {
    userId: "99999999-9999-4999-8999-999999999999", // Kevin Thomas
    departmentId: 1, // Public Works
    availabilityStatus: "Available",
    currentWorkload: 2,
    maxWorkload: 8,
    createdAt: "2026-02-14T09:30:00.000Z",
    updatedAt: "2026-06-19T10:10:00.000Z",
  },
  {
    userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", // Anjali Pillai
    departmentId: 2, // Water Supply
    availabilityStatus: "Available",
    currentWorkload: 4,
    maxWorkload: 8,
    createdAt: "2026-02-20T11:00:00.000Z",
    updatedAt: "2026-06-21T12:40:00.000Z",
  },
  {
    userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", // Farhan Rashid
    departmentId: 4, // Street Lighting
    availabilityStatus: "OnLeave",
    currentWorkload: 1,
    maxWorkload: 6,
    createdAt: "2026-03-01T08:45:00.000Z",
    updatedAt: "2026-06-22T09:20:00.000Z",
  },
]
