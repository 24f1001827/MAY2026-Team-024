import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/admin/users?role=&status=
 *
 * Admin-only list of users, proxied to Flask `/admin/users` with the caller's
 * Bearer token (read server-side from the httpOnly cookie). `role`/`status`
 * filter values are passed through (e.g. status=PendingApproval).
 *
 * Why this can't collapse into the browser `ApiClient`: the JWT lives in an
 * httpOnly cookie the browser can't read, so the Bearer header must be attached
 * server-side. Same-origin keeps `API_BASE_URL` off the client too.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const { status, body } = await backendFetch("/admin/users", {
    params: {
      role: searchParams.get("role") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    },
  })

  return NextResponse.json(body, { status })
}
