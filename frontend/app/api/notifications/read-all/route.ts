import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * PATCH /api/notifications/read-all
 *
 * Mark all of the caller's notifications read, proxied to Flask
 * `PATCH /notifications/read-all`.
 */
export async function PATCH() {
  const { status, body } = await backendFetch("/notifications/read-all", {
    method: "PATCH",
  })
  return NextResponse.json(body, { status })
}
