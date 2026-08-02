/**
 * Query-key factory for auth-related queries. Auth is mutation-heavy today, but
 * a `session()` key is reserved for a future "who am I" query so mutations can
 * invalidate it consistently.
 */
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
}
