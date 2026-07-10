import type { User } from "@/types/user"

/**
 * Dummy `users` covering every role. Other mock files (citizens, officers,
 * agencies) reference these ids so the sample data stays internally consistent.
 *
 * The `passwordHash` values are placeholders, not real bcrypt hashes. The inline
 * comment beside each is the intended dev/plaintext password for that account.
 */
export const mockUsers: User[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Aarav Menon",
    email: "admin@rastro.gov",
    phone: "+919800000001",
    passwordHash: "$2b$10$mockhashadmin000000000000000000000000000000000", // password: Admin@123
    provider: "local",
    providerId: null,
    role: "Admin",
    status: "Active",
    deletedAt: null,
    createdAt: "2026-01-05T09:00:00.000Z",
    updatedAt: "2026-06-01T11:30:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Priya Nair",
    email: "priya.nair@rastro.gov",
    phone: "+919800000002",
    passwordHash: "$2b$10$mockhashofficer00000000000000000000000000000000", // password: Officer@123
    provider: "local",
    providerId: null,
    role: "Officer",
    status: "Active",
    deletedAt: null,
    createdAt: "2026-01-10T08:15:00.000Z",
    updatedAt: "2026-06-20T14:45:00.000Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Rahul Verma",
    email: "rahul.verma@rastro.gov",
    phone: "+919800000003",
    passwordHash: "$2b$10$mockhashofficer11111111111111111111111111111111", // password: Officer@123
    provider: "local",
    providerId: null,
    role: "Officer",
    status: "Active",
    deletedAt: null,
    createdAt: "2026-02-02T10:00:00.000Z",
    updatedAt: "2026-06-18T16:20:00.000Z",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Sneha Iyer",
    email: "sneha.iyer@example.com",
    phone: "+919800000004",
    passwordHash: "$2b$10$mockhashcitizen00000000000000000000000000000000", // password: Citizen@123
    provider: "local",
    providerId: null,
    role: "Citizen",
    status: "Active",
    deletedAt: null,
    createdAt: "2026-03-14T12:30:00.000Z",
    updatedAt: "2026-03-14T12:30:00.000Z",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Mohammed Ali",
    email: "m.ali@example.com",
    phone: "+919800000005",
    passwordHash: "$2b$10$mockhashcitizen11111111111111111111111111111111", // password: Citizen@123 (also has Google login)
    provider: "google",
    providerId: "google-oauth2|1078540023145",
    role: "Citizen",
    status: "Active",
    deletedAt: null,
    createdAt: "2026-04-01T07:45:00.000Z",
    updatedAt: "2026-05-22T09:10:00.000Z",
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    name: "Divya Krishnan",
    email: "divya.k@example.com",
    phone: "+919800000006",
    passwordHash: "$2b$10$mockhashcitizen22222222222222222222222222222222", // password: Citizen@123
    provider: "local",
    providerId: null,
    role: "Citizen",
    status: "PendingApproval",
    deletedAt: null,
    createdAt: "2026-06-28T18:05:00.000Z",
    updatedAt: "2026-06-28T18:05:00.000Z",
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    name: "BuildRight Infra Pvt Ltd",
    email: "contact@buildright.co.in",
    phone: "+919800000007",
    passwordHash: "$2b$10$mockhashagency000000000000000000000000000000000", // password: Agency@123
    provider: "local",
    providerId: null,
    role: "Agency",
    status: "Active",
    deletedAt: null,
    createdAt: "2026-01-20T11:00:00.000Z",
    updatedAt: "2026-06-15T13:00:00.000Z",
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    name: "UrbanWorks Constructions",
    email: "hello@urbanworks.in",
    phone: "+919800000008",
    passwordHash: "$2b$10$mockhashagency111111111111111111111111111111111", // password: Agency@123
    provider: "local",
    providerId: null,
    role: "Agency",
    status: "PendingApproval",
    deletedAt: null,
    createdAt: "2026-05-30T15:20:00.000Z",
    updatedAt: "2026-05-30T15:20:00.000Z",
  },
]
