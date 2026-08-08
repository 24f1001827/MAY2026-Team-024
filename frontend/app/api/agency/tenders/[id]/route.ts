import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/agency/tenders/[id]
 *
 * Detail for a single tender, proxied to Flask `GET /agency/tenders/{id}`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(`/agency/tenders/${id}`)
  return NextResponse.json(body, { status })
}
