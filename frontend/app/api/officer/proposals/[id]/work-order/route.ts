import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * POST /api/officer/proposals/[id]/work-order
 *
 * Officer awards a work order to the agency behind an accepted proposal,
 * proxied to Flask `POST /officer/proposals/{id}/work-order`.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const json = await request.json().catch(() => ({}))
  const { status, body } = await backendFetch(
    `/officer/proposals/${id}/work-order`,
    { method: "POST", json },
  )
  return NextResponse.json(body, { status })
}
