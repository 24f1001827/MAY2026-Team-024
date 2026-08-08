import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * PATCH /api/officer/work-orders/[id]/mark-incomplete
 *
 * The reviewing officer sends a work order back as incomplete (with remarks),
 * proxied to Flask `PATCH /officer/work-orders/{id}/mark-incomplete`.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const json = await request.json().catch(() => ({}))
  const { status, body } = await backendFetch(
    `/officer/work-orders/${id}/mark-incomplete`,
    { method: "PATCH", json },
  )
  return NextResponse.json(body, { status })
}
