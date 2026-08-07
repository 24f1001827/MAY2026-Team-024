import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * POST /api/complaints  (multipart/form-data)
 *
 * Citizen files a complaint (fields + optional `images` files), proxied to
 * Flask `POST /complaints` with the caller's Bearer token. The incoming
 * multipart body is forwarded as-is so file parts survive; the backend returns
 * the full created complaint under `data`.
 *
 * Parsing to `FormData` and re-sending the object is deliberate: fetch
 * re-serializes it with a fresh boundary that matches the body it sends. Do
 * not "optimize" this into streaming `request.body` through while copying the
 * client's `Content-Type` — that forwards a boundary which no longer matches
 * the re-framed body, and Flask fails to parse the parts.
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
