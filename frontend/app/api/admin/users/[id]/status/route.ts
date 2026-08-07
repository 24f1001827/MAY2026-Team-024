import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * PATCH /api/admin/users/[id]/status  body: { status }
 *
 * Admin-only user status change (approve → "Active", reject → "Rejected"),
 * proxied to Flask `PATCH /admin/users/{id}/status` with the caller's Bearer
 * token. The backend also fires the approval email for officers/agencies.
 *
 * Server-side proxy for the same reason as the list handler: the JWT is in an
 * httpOnly cookie, so the Bearer header has to be attached here, not in the client.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let payload: { status?: unknown }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
  }

  if (typeof payload.status !== "string") {
    return NextResponse.json({ message: "A status is required." }, { status: 400 })
  }

  const { status, body } = await backendFetch(`/admin/users/${id}/status`, {
    method: "PATCH",
    json: { status: payload.status },
  })

  return NextResponse.json(body, { status })
}
