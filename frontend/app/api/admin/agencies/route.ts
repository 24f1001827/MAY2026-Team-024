import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/admin/agencies
 *
 * Admin agency directory, proxied to Flask `GET /admin/agencies`.
 */
export async function GET() {
  const { status, body } = await backendFetch("/admin/agencies")
  return NextResponse.json(body, { status })
}
