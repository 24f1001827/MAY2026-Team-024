import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/officer/proposals/[id]
 *
 * Detail for a single proposal, proxied to Flask `GET /officer/proposals/{id}`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(`/officer/proposals/${id}`)
  return NextResponse.json(body, { status })
}
