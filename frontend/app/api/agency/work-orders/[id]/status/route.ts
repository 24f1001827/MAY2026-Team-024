import { NextResponse } from "next/server"

import { backendFetch } from "@/lib/api/backend"

/**
 * PATCH /api/agency/work-orders/[id]/status  (multipart/form-data)
 *
 * Agency updates a work order's status (`status` field + optional
 * `completion_proof` file), proxied to Flask
 * `PATCH /agency/work-orders/{id}/status`. The multipart body is re-parsed and
 * forwarded so file parts survive with a matching boundary.
 */
export async function PATCH(
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

  const { status, body } = await backendFetch(
    `/agency/work-orders/${id}/status`,
    { method: "PATCH", formData },
  )
  return NextResponse.json(body, { status })
}
