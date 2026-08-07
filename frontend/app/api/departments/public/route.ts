import { NextResponse } from "next/server"

import { apiUrl } from "@/lib/api/config"

/**
 * GET /api/departments/public
 *
 * Public list of departments (id + name) for the officer registration dropdown.
 * Proxies to Flask `GET /departments/public`, which is intentionally
 * unauthenticated. Unlike the admin routes, this attaches NO Bearer token — the
 * caller is registering and has no session yet — so it deliberately does NOT
 * use `backendFetch` (which short-circuits to 401 without a token).
 *
 * Kept same-origin so the backend base URL never reaches the browser.
 */
export async function GET() {
  const res = await fetch(apiUrl("/departments/public"), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })

  let body: unknown = {}
  try {
    body = await res.json()
  } catch {
    // Non-JSON error page — pass the status through with an empty body.
  }

  return NextResponse.json(body, { status: res.status })
}
