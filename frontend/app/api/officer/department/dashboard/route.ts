import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/officer/department/dashboard
 *
 * The logged-in officer's department dashboard (department + officers +
 * complaints), proxied to Flask `GET /officer/department/dashboard` with the
 * caller's Bearer token.
 */
export async function GET() {
  const { status, body } = await backendFetch("/officer/department/dashboard")
  return NextResponse.json(body, { status })
}
