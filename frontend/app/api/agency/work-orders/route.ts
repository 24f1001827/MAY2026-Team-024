import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/agency/work-orders
 *
 * Work orders assigned to the logged-in agency, proxied to Flask
 * `GET /agency/work-orders`.
 */
export async function GET() {
  const { status, body } = await backendFetch("/agency/work-orders")
  return NextResponse.json(body, { status })
}
