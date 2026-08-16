import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/api/backend"

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  if (!payload) return NextResponse.json({ message: "Invalid request body." }, { status: 400 })
  const { status, body } = await backendFetch("/complaints/ai/department-suggestion", { method: "POST", json: payload })
  return NextResponse.json(body, { status })
}
