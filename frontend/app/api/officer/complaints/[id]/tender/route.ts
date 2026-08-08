import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * POST /api/officer/complaints/[id]/tender
 *
 * Officer publishes a tender for a complaint, proxied to Flask
 * `POST /officer/complaints/{id}/tender` with the caller's Bearer token.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const json = await request.json().catch(() => ({}))
  const { status, body } = await backendFetch(
    `/officer/complaints/${id}/tender`,
    { method: "POST", json },
  )
  return NextResponse.json(body, { status })
}
