import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET    /api/admin/departments/[id]   → one department
 * PATCH  /api/admin/departments/[id]   → update (partial)
 * DELETE /api/admin/departments/[id]   → soft-delete
 *
 * Admin-only, proxied to Flask `/admin/departments/{id}` with the caller's
 * Bearer token. The backend enforces the admin role.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(`/admin/departments/${id}`)
  return NextResponse.json(body, { status })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
  }

  const { status, body } = await backendFetch(`/admin/departments/${id}`, {
    method: "PATCH",
    json: payload,
  })

  return NextResponse.json(body, { status })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(`/admin/departments/${id}`, {
    method: "DELETE",
  })
  return NextResponse.json(body, { status })
}
