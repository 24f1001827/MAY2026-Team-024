import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * PATCH /api/officer/work-orders/[id]/verify
 *
 * The reviewing officer verifies a completed work order, proxied to Flask
 * `PATCH /officer/work-orders/{id}/verify`. No request body.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(
    `/officer/work-orders/${id}/verify`,
    { method: "PATCH" },
  )
  return NextResponse.json(body, { status })
}
