import { NextResponse } from "next/server"

import { clearSessionCookies } from "@/lib/auth/session"

/**
 * POST /api/auth/logout
 *
 * Clears the session cookies. Purely client-side sign-out — the backend JWTs
 * are stateless, so there is nothing to revoke server-side.
 *
 * Why this can't collapse into the browser `ApiClient`: only a server response
 * can clear an httpOnly cookie, so sign-out has to run here, not in client JS.
 */
export async function POST() {
  await clearSessionCookies()
  return NextResponse.json({ success: true })
}
