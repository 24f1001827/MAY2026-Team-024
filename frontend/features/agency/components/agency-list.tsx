/**
 * Shared agency view-model used by the detail, edit, and form surfaces. The
 * agencies index now renders `AgenciesGridTable`; this file retains only the
 * type its other consumers import.
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
