import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/api/backend"

/**
 * GET /api/complaints/[id]/cluster
 *
 * Every complaint linked to the same real-world issue as this one, primary
 * first. Proxied to Flask `GET /complaints/{id}/cluster`.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status, body } = await backendFetch(`/complaints/${id}/cluster`)
  return NextResponse.json(body, { status })
}
