import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/api/backend"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status, body } = await backendFetch(`/complaints/${id}/cluster/dispute`, { method: "POST", json: {} })
  return NextResponse.json(body, { status })
}
