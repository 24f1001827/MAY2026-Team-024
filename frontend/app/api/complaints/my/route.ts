import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/complaints/my
 *
 * The signed-in citizen's own complaints, proxied to Flask `GET /complaints/my`
 * with the caller's Bearer token.
 */
export async function GET() {
  const { status, body } = await backendFetch("/complaints/my")
  return NextResponse.json(body, { status })
}
