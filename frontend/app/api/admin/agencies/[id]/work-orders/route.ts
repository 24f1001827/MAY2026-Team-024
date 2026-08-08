import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/admin/agencies/[id]/work-orders
 *
 * Work orders the agency is executing, proxied to Flask
 * `GET /admin/agencies/{id}/work-orders`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(
    `/admin/agencies/${id}/work-orders`,
  )
  return NextResponse.json(body, { status })
}
