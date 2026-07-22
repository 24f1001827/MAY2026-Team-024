/**
 * Payload collected by the agency create form. Flattens the `user`-side profile
 * (name / email / phone) together with the `agencies` entity fields, so the form
 * has a single typed shape to POST once the backend lands.
 */
export interface CreateAgencyRequest {
  name: string
  contactPerson: string
  email: string
  phone: string
  registrationNumber: string
  licenseNumber: string
  maxProjects: number
}
