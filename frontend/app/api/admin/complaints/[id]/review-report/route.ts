import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/admin/complaints/[id]/review-report
 *
 * The officer's review report for a complaint (null if none), proxied to Flask
 * `GET /admin/complaints/{id}/review-report`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(
    `/admin/complaints/${id}/review-report`,
  )
  return NextResponse.json(body, { status })
}
