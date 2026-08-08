import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * PATCH /api/complaints/[id]/reopen
 *
 * The citizen owner reopens a resolved/closed complaint with a reason, proxied
 * to Flask `PATCH /complaints/{id}/reopen`.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const json = await request.json().catch(() => ({}))
  const { status, body } = await backendFetch(`/complaints/${id}/reopen`, {
    method: "PATCH",
    json,
  })
  return NextResponse.json(body, { status })
}
