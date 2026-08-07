import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/officers
 *
 * Shared officer directory (name, department, availability), proxied to Flask
 * `GET /officers` with the caller's Bearer token. Any authenticated user.
 */
export async function GET() {
  const { status, body } = await backendFetch("/officers")
  return NextResponse.json(body, { status })
}
