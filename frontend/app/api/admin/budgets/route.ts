import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET  /api/admin/budgets  — all department budgets across years.
 * POST /api/admin/budgets  — fund a department's budget (create or top up).
 *
 * Proxied to Flask `/admin/budgets` (admin-only).
 */
export async function GET() {
  const { status, body } = await backendFetch("/admin/budgets")
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}))
  const { status, body } = await backendFetch("/admin/budgets", {
    method: "POST",
    json,
  })
  return NextResponse.json(body, { status })
}
