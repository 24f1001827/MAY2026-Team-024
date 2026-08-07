import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * PATCH /api/admin/users/[id]/max-workload  body: { max_workload }
 *
 * Admin sets an officer's capacity, proxied to Flask
 * `PATCH /admin/users/{id}/max-workload` with the caller's Bearer token.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let payload: { max_workload?: unknown }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
  }

  if (typeof payload.max_workload !== "number") {
    return NextResponse.json(
      { message: "A numeric max_workload is required." },
      { status: 400 },
    )
  }

  const { status, body } = await backendFetch(`/admin/users/${id}/max-workload`, {
    method: "PATCH",
    json: { max_workload: payload.max_workload },
  })

  return NextResponse.json(body, { status })
}
