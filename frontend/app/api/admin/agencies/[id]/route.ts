import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/admin/agencies/[id]
 *
 * A single agency, proxied to Flask `GET /admin/agencies/{id}`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(`/admin/agencies/${id}`)
  return NextResponse.json(body, { status })
}
