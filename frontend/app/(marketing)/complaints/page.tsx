import type { Metadata } from "next"

import { fetchPublicComplaints } from "@/lib/api/public-complaints"
import { ComplaintsMapView } from "@/features/complaint/components/complaints-map-view"

export const metadata: Metadata = {
  title: "Complaints Search",
  description:
    "Browse civic complaints reported across the city. Reporter identities are kept anonymous.",
}

export default async function PublicComplaintsPage() {
  const complaints = await fetchPublicComplaints()

  // Departments for the filter dropdown, derived from the complaints on the map
  // (deduped by id) — no separate fetch needed.
  const departments = Array.from(
    new Map(
      complaints.map((c) => [c.departmentId, c.departmentName]),
    ).entries(),
  )
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  // Fill the viewport below the sticky site header (h-16 / 4rem).
  return (
    <div className="h-[calc(100svh-4rem)] w-full">
      <ComplaintsMapView
        complaints={complaints}
        departments={departments}
        isPublic
      />
    </div>
  )
}
