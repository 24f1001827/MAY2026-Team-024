import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * PATCH /api/officer/complaints/[id]/reject
 *
 * The assigned officer rejects their pending assignment, proxied to Flask
 * `PATCH /officer/complaints/{id}/reject` with the caller's Bearer token.
 * No request body.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(
    `/officer/complaints/${id}/reject`,
    { method: "PATCH" },
  )
  return NextResponse.json(body, { status })
}
