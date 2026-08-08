import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/officer/tenders/[id]/proposals
 *
 * Proposals submitted against one of the officer's tenders, proxied to Flask
 * `GET /officer/tenders/{id}/proposals`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(
    `/officer/tenders/${id}/proposals`,
  )
  return NextResponse.json(body, { status })
}
