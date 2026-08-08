import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/agency/tenders
 *
 * Open tenders the agency can bid on, proxied to Flask `GET /agency/tenders`
 * with the caller's Bearer token.
 */
export async function GET() {
  const { status, body } = await backendFetch("/agency/tenders")
  return NextResponse.json(body, { status })
}
