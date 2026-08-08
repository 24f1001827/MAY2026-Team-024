import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/agency/work-orders/[id]
 *
 * Detail for a single work order, proxied to Flask
 * `GET /agency/work-orders/{id}`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(`/agency/work-orders/${id}`)
  return NextResponse.json(body, { status })
}
