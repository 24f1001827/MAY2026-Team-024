import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/officer/tenders
 *
 * The officer's own tenders (oversight list), proxied to Flask
 * `GET /officer/tenders`.
 */
export async function GET() {
  const { status, body } = await backendFetch("/officer/tenders")
  return NextResponse.json(body, { status })
}
