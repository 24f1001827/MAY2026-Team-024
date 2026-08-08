import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/notifications
 *
 * The signed-in user's notifications, proxied to Flask `GET /notifications`
 * (scoped to the caller by their Bearer token).
 */
export async function GET() {
  const { status, body } = await backendFetch("/notifications")
  return NextResponse.json(body, { status })
}
