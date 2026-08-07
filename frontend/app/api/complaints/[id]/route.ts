import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * GET    /api/complaints/[id]   → one complaint (with images/remarks)
 * PUT    /api/complaints/[id]   → update (multipart, optional image replace)
 * DELETE /api/complaints/[id]   → delete
 *
 * Proxied to Flask `/complaints/{id}` with the caller's Bearer token. The
 * backend enforces ownership (citizen) / visibility.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(`/complaints/${id}`)
  return NextResponse.json(body, { status })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { message: "Expected multipart form data." },
      { status: 400 },
    )
  }

  const { status, body } = await backendFetch(`/complaints/${id}`, {
    method: "PUT",
    formData,
  })

  return NextResponse.json(body, { status })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { status, body } = await backendFetch(`/complaints/${id}`, {
    method: "DELETE",
  })
  return NextResponse.json(body, { status })
}
