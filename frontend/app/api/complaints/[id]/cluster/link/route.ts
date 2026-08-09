import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/api/backend"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await request.json().catch(() => null)
  if (!payload) return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
  const { status, body } = await backendFetch(`/complaints/${id}/cluster/link`, { method: "POST", json: payload })
  return NextResponse.json(body, { status })
}
