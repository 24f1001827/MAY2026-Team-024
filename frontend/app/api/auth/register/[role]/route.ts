import { NextResponse } from "next/server"

import { backendRegister, type RegisterRole } from "@/lib/auth/api"

const VALID_ROLES: RegisterRole[] = ["citizen", "agency", "officer"]

/**
 * POST /api/auth/register/[role]
 *
 * Proxies registration to Flask `register/{citizen,agency,officer}`. No session
 * is established (accounts other than citizens await admin approval) — the
 * backend's status (201 created, 409 conflict, 422 validation) and body are
 * passed straight through for the register form to handle.
 *
 * Unlike login/logout this sets no cookie, so it *could* call Flask directly —
 * but it's kept as a handler on purpose: the browser then only ever talks
 * same-origin `/api`, `API_BASE_URL` stays server-side, and the `ApiClient`
 * keeps one consistent baseURL + error shape across every auth call. Don't
 * "optimize" it away.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ role: string }> },
) {
  const { role } = await params

  if (!VALID_ROLES.includes(role as RegisterRole)) {
    return NextResponse.json({ message: "Unknown account type." }, { status: 404 })
  }

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
  }

  const { status, body } = await backendRegister(role as RegisterRole, payload)

  return NextResponse.json(body, { status })
}
