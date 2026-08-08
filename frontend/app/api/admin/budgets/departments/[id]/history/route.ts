import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/admin/budgets/departments/[id]/history
 *
 * A department's budget history (additions + allocations), proxied to Flask
 * `GET /admin/budgets/departments/{id}/history`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(
    `/admin/budgets/departments/${id}/history`,
  )
  return NextResponse.json(body, { status })
}
