import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * POST /api/complaints  (multipart/form-data)
 *
 * Citizen files a complaint (fields + optional `images` files), proxied to
 * Flask `POST /complaints` with the caller's Bearer token. The incoming
 * multipart body is forwarded as-is so file parts survive; the backend returns
 * the full created complaint under `data`.
 */
export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { message: "Expected multipart form data." },
      { status: 400 },
    )
  }

  const { status, body } = await backendFetch("/complaints", {
    method: "POST",
    formData,
  })

  return NextResponse.json(body, { status })
}
