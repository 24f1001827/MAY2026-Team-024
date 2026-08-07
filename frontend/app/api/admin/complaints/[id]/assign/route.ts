import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * POST /api/admin/complaints/[id]/assign   body: { officer_id, assignment_note? }
 *
 * Admin complaint allotment, proxied to Flask
 * `POST /admin/complaints/{id}/assign` with the caller's Bearer token.
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
    `/admin/complaints/${id}/assign`,
    { method: "POST", json: payload },
  )

  return NextResponse.json(body, { status })
}
