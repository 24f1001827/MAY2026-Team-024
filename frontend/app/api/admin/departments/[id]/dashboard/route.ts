import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/admin/departments/[id]/dashboard
 *
 * Admin per-department dashboard (department + officers + complaints), proxied
 * to Flask `GET /admin/departments/{id}/dashboard` with the caller's Bearer
 * token. Admin-only (enforced by the backend).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(
    `/admin/departments/${id}/dashboard`,
  )
  return NextResponse.json(body, { status })
}
