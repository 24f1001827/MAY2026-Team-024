/**
 * lib/utils/auth/validate.ts
 *
 * Client-side validation for the auth forms, mirroring the backend's
 * `RegisterCitizenSchema` / `RegisterOfficerSchema` / `RegisterAgencySchema`
 * validators so users get immediate, specific feedback instead of a round-trip
 * 422. No imports — unit-testable in isolation.
 *
 * The backend raises on the *first* failing rule only, so a user fixing one
 * problem discovers the next one on the following submit. `checkPassword`
 * returns every rule's state at once so the form can show the full picture
 * while they type; `validatePassword` collapses that back to a single message
 * in the backend's own order for the submit path.
 *
 * Keep these rules in lockstep with `backend/app/schemas/auth_schema.py`.
 */

/**
 * The exact special characters the backend accepts. Anything outside this set
 * (`-`, `_`, `+`, `[`, `]`, `;`, `'`, `/`, `~`, backtick…) does *not* count as
 * a special character there, so the UI has to name them or users pick one that
 * silently fails server-side.
 */
export const PASSWORD_SPECIAL_CHARS = `!@#$%^&*(),.?":{}|<>`

/** Minimum password length (backend: `len(value) < 8`). */
export const PASSWORD_MIN_LENGTH = 8

/** One password requirement, in the order the backend checks it. */
export interface PasswordRule {
  /** Stable key for React lists. */
  id: string
  /** Short label for the live requirement checklist. */
  label: string
  /** Full sentence used when this is the blocking failure on submit. */
  message: string
  test: (value: string) => boolean
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    message: `Password must contain at least ${PASSWORD_MIN_LENGTH} characters.`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "uppercase",
    label: "An uppercase letter",
    message: "Password must contain at least one uppercase letter.",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "A lowercase letter",
    message: "Password must contain at least one lowercase letter.",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "digit",
    label: "A number",
    message: "Password must contain at least one digit.",
    test: (value) => /\d/.test(value),
  },
  {
    id: "special",
    label: `A special character (${PASSWORD_SPECIAL_CHARS})`,
    message: `Password must contain at least one special character (${PASSWORD_SPECIAL_CHARS}).`,
    // Mirrors the backend's character class exactly — every character in it is
    // literal inside a regex class, so it needs no escaping here.
    test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
  },
]

/** A rule paired with whether the current input satisfies it. */
export interface PasswordRuleState {
  rule: PasswordRule
  met: boolean
}

/** Evaluate every rule, for the live requirement checklist. */
export function checkPassword(value: string): PasswordRuleState[] {
  return PASSWORD_RULES.map((rule) => ({ rule, met: rule.test(value) }))
}

/** True when the password satisfies every rule the backend enforces. */
export function isPasswordValid(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value))
}

/**
 * The first unmet requirement's message, or null when the password is valid.
 * Rule order matches the backend so the client and server agree on which
 * problem to report first.
 */
export function validatePassword(value: string): string | null {
  return PASSWORD_RULES.find((rule) => !rule.test(value))?.message ?? null
}

/** The role-specific fields each registration form collects on top of the base. */
export interface RegisterExtras {
  /** Agency: primary contact's name. */
  contactPerson?: string
  /** Agency: company registration number. */
  registrationNumber?: string
  /** Agency: trade license number. */
  licenseNumber?: string
  /** Officer: the department they belong to. */
  department?: string
}

/**
 * Validate the registration fields the backend also checks, in its own order.
 * Returns the first human-readable error, or null when the input is valid.
 *
 * Role-specific fields are only checked when supplied, so the citizen, officer
 * and agency forms can all call this with just what they collect.
 */
export function validateRegisterInput(
  input: {
    name: string
    email: string
    phone: string
    password: string
  } & RegisterExtras,
): string | null {
  const name = input.name.trim()
  if (name.length < 3) return "Name must be at least 3 characters."
  if (name.length > 100) return "Name cannot exceed 100 characters."

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
    return "Enter a valid email address."

  // Indian mobile number: exactly 10 digits starting 6-9 (per TRAI numbering).
  if (!/^[6-9]\d{9}$/.test(input.phone.trim()))
    return "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9."

  const passwordError = validatePassword(input.password)
  if (passwordError) return passwordError

  if (input.contactPerson !== undefined) {
    const contact = input.contactPerson.trim()
    if (contact.length < 2) return "Contact person name is too short."
    if (contact.length > 100)
      return "Contact person name cannot exceed 100 characters."
  }

  if (input.registrationNumber !== undefined) {
    const registration = input.registrationNumber.trim()
    if (registration.length === 0) return "Registration number is required."
    if (registration.length > 100)
      return "Registration number cannot exceed 100 characters."
  }

  if (input.licenseNumber !== undefined) {
    const license = input.licenseNumber.trim()
    if (license.length === 0) return "License number is required."
    if (license.length > 100)
      return "License number cannot exceed 100 characters."
  }

  if (input.department !== undefined) {
    const department = input.department.trim()
    if (department.length === 0) return "Department is required."
    if (department.length < 2) return "Department name is too short."
    if (department.length > 100)
      return "Department name cannot exceed 100 characters."
  }

  return null
}
