/**
 * lib/auth/account-status.ts
 *
 * A non-active account (pending / rejected / blocked) can't sign in — the
 * backend returns 403 with a descriptive message (see AuthService.login).
 * Instead of a toast, the login form routes the user to a status page. This
 * classifies the backend's 403 message into which page to show.
 */

export type AccountStatusReason = "pending" | "rejected" | "blocked"

export function classifyAccountStatus(
  message: string,
): AccountStatusReason | null {
  const m = message.toLowerCase()
  if (m.includes("approval") || m.includes("awaiting")) return "pending"
  if (m.includes("reject")) return "rejected"
  if (m.includes("block")) return "blocked"
  return null
}
