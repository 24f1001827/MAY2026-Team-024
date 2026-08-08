import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/agency/proposals
 *
 * Proposals submitted by the logged-in agency, proxied to Flask
 * `GET /agency/proposals`.
 */
export async function GET() {
  const { status, body } = await backendFetch("/agency/proposals")
  return NextResponse.json(body, { status })
}
