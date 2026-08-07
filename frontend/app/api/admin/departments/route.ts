import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET  /api/admin/departments   → admin list of departments
 * POST /api/admin/departments   → create a department
 *
 * Admin-only, proxied to Flask `/admin/departments` with the caller's Bearer
 * token (read server-side from the httpOnly cookie). The backend enforces the
 * admin role; this handler just forwards.
 */
export async function GET() {
  const { status, body } = await backendFetch("/admin/departments")
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
  }

  const { status, body } = await backendFetch("/admin/departments", {
    method: "POST",
    json: payload,
  })

  return NextResponse.json(body, { status })
}
