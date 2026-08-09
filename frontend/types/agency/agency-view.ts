/**
 * Display shape for an agency profile, as the detail surface renders it. A
 * lean projection of `AdminAgency` (no status/createdAt) shared by the agency
 * detail components.
 */
export interface AgencyView {
  id: string
  name: string
  email: string
  phone: string
  registrationNumber: string
  licenseNumber: string
  contactPerson: string
  currentProjects: number
  maxProjects: number
}
