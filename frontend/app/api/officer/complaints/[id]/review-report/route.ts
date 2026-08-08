import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * POST /api/officer/complaints/[id]/review-report
 *
 * The assigned officer submits their inspection report (findings + decision),
 * proxied to Flask `POST /officer/complaints/{id}/review-report`.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const json = await request.json().catch(() => ({}))
  const { status, body } = await backendFetch(
    `/officer/complaints/${id}/review-report`,
    { method: "POST", json },
  )
  return NextResponse.json(body, { status })
}
