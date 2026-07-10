/**
 * Lightweight mock "session" until real auth lands. The logged-in user's id is
 * stored in a cookie so the (server) dashboard layout can pick the right user
 * and role. Replace this whole module when the auth/session layer is wired.
 */

export const MOCK_SESSION_COOKIE = "rastro_uid"

const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/** Client-only: persist the signed-in user id. */
export function setMockSession(userId: string): void {
  document.cookie = `${MOCK_SESSION_COOKIE}=${userId}; path=/; max-age=${MAX_AGE}; samesite=lax`
}

/** Client-only: clear the mock session. */
export function clearMockSession(): void {
  document.cookie = `${MOCK_SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`
}
