import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * PATCH /api/officer/complaints/[id]/reject
 *
 * The assigned officer rejects their pending assignment, proxied to Flask
 * `PATCH /officer/complaints/{id}/reject` with the caller's Bearer token.
 * Optional `{ reason }` body — the department head reads it before re-allotting.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const payload = await request.json().catch(() => ({}))
  const { status, body } = await backendFetch(
    `/officer/complaints/${id}/reject`,
    { method: "PATCH", json: payload ?? {} },
  )
  return NextResponse.json(body, { status })
}
