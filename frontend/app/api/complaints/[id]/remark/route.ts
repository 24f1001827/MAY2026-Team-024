import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * POST /api/complaints/[id]/remark
 *
 * Officer/admin adds a remark to a complaint's activity timeline, proxied to
 * Flask `POST /complaints/{id}/remark`.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const json = await request.json().catch(() => ({}))
  const { status, body } = await backendFetch(`/complaints/${id}/remark`, {
    method: "POST",
    json,
  })
  return NextResponse.json(body, { status })
}
