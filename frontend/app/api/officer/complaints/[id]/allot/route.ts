import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * POST /api/officer/complaints/[id]/allot   body: { officer_id, assignment_note? }
 *
 * Head-only complaint allotment, proxied to Flask
 * `POST /officer/complaints/{id}/allot` with the caller's Bearer token. The
 * backend enforces that only the department head may allot, within their own
 * department.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
  }

  const { status, body } = await backendFetch(
    `/officer/complaints/${id}/allot`,
    { method: "POST", json: payload },
  )

  return NextResponse.json(body, { status })
}
