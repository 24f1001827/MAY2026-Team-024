import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/admin/complaints
 *
 * Admin list of all complaints, proxied to Flask `GET /admin/complaints` with
 * the caller's Bearer token. The backend enforces the admin role.
 */
export async function GET() {
  const { status, body } = await backendFetch("/admin/complaints")
  return NextResponse.json(body, { status })
}
