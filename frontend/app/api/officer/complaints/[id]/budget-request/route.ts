import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * POST /api/officer/complaints/[id]/budget-request
 *
 * The assigned officer requests budget allocation (when the review decision was
 * TenderRequired), proxied to Flask `POST /officer/complaints/{id}/budget-request`.
 * No request body.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(
    `/officer/complaints/${id}/budget-request`,
    { method: "POST" },
  )
  return NextResponse.json(body, { status })
}
