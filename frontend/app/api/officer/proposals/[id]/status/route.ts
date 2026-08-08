import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * PATCH /api/officer/proposals/[id]/status
 *
 * Officer shortlists / accepts / rejects a proposal, proxied to Flask
 * `PATCH /officer/proposals/{id}/status`.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const json = await request.json().catch(() => ({}))
  const { status, body } = await backendFetch(
    `/officer/proposals/${id}/status`,
    { method: "PATCH", json },
  )
  return NextResponse.json(body, { status })
}
