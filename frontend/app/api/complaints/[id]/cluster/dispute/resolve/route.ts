import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/api/backend"

/**
 * POST /api/complaints/[id]/cluster/dispute/resolve
 *
 * Staff settle an open grouping dispute — `Upheld` splits the complaint back
 * into its own issue, `Rejected` keeps it linked. Proxied to Flask
 * `POST /complaints/{id}/cluster/dispute/resolve`.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await request.json().catch(() => null)
  if (!payload) return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
  const { status, body } = await backendFetch(`/complaints/${id}/cluster/dispute/resolve`, { method: "POST", json: payload })
  return NextResponse.json(body, { status })
}
