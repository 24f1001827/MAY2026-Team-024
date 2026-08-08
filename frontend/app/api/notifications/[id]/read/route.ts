import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * PATCH /api/notifications/[id]/read
 *
 * Mark a single notification read, proxied to Flask
 * `PATCH /notifications/{id}/read`.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(`/notifications/${id}/read`, {
    method: "PATCH",
  })
  return NextResponse.json(body, { status })
}
