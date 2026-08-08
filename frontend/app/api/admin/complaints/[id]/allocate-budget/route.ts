import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * PATCH /api/admin/complaints/[id]/allocate-budget
 *
 * Admin allocates budget to a complaint awaiting it, proxied to Flask
 * `PATCH /admin/complaints/{id}/allocate-budget`.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const json = await request.json().catch(() => ({}))
  const { status, body } = await backendFetch(
    `/admin/complaints/${id}/allocate-budget`,
    { method: "PATCH", json },
  )
  return NextResponse.json(body, { status })
}
