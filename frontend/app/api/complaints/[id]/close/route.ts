import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * PATCH /api/complaints/[id]/close
 *
 * The citizen owner closes a resolved complaint, proxied to Flask
 * `PATCH /complaints/{id}/close`. No request body.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(`/complaints/${id}/close`, {
    method: "PATCH",
  })
  return NextResponse.json(body, { status })
}
