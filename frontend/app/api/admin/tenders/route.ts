import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/admin/tenders
 *
 * Every tender in the system (admin oversight), proxied to Flask
 * `GET /admin/tenders`.
 */
export async function GET() {
  const { status, body } = await backendFetch("/admin/tenders")
  return NextResponse.json(body, { status })
}
