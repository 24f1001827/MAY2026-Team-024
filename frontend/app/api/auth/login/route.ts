import { NextResponse } from "next/server"

import { backendLogin } from "@/lib/auth/api"
import { setSessionCookies, UnknownSessionRoleError } from "@/lib/auth/session"

/**
 * POST /api/auth/login
 *
 * Proxies email/password credentials to the Flask backend. On success, stores
 * the issued JWTs + user snapshot in httpOnly cookies and returns the user
 * (without tokens). On failure, forwards the backend's message and status so
 * the login form can surface it (401 = bad creds, 403 = pending/blocked, etc.).
 *
 * Why this can't collapse into the browser `ApiClient`: a client fetch cannot
 * set an httpOnly cookie (only a server response can) and must not hold the JWT.
 * This handler is the server half of the login hop — the `ApiClient` is the
 * client half that calls it. Deleting it would force the token into JS-readable
 * storage and break the server-side `requireUser()` gating. See `lib/auth/session.ts`.
 */
export async function POST(request: Request) {
  let payload: { email?: unknown; password?: unknown }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : ""
  const password = typeof payload.password === "string" ? payload.password : ""

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 },
    )
  }

  const { status, body } = await backendLogin(email, password)

  if (status !== 200 || !body.data) {
    return NextResponse.json(
      { message: body.message ?? "Unable to sign in. Please try again." },
      { status: status === 200 ? 502 : status },
    )
  }

  try {
    await setSessionCookies(body.data)
  } catch (err) {
    if (err instanceof UnknownSessionRoleError) {
      console.error("[auth]", err.message)
      return NextResponse.json(
        { message: "Unable to sign in. Please try again." },
        { status: 502 },
      )
    }
    throw err
  }

  return NextResponse.json({ user: body.data.user })
}
