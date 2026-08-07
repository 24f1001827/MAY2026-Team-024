import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET   /api/settings   → read org settings (any authenticated user)
 * PATCH /api/settings   → update org settings (admin-only, enforced by backend)
 *
 * Proxied to Flask `/settings` with the caller's Bearer token.
 */
export async function GET() {
  const { status, body } = await backendFetch("/settings")
  return NextResponse.json(body, { status })
}

export async function PATCH(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
  }

  const { status, body } = await backendFetch("/settings", {
    method: "PATCH",
    json: payload,
  })

  return NextResponse.json(body, { status })
}
