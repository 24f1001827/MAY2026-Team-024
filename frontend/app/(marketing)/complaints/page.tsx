import type { Metadata } from "next"

import { mockDepartments } from "@/components/shared/mock-data"
import { getPublicComplaints } from "@/lib/utils/complaint/public-complaints"
import { ComplaintsMapView } from "@/features/complaint/components/complaints-map-view"

export const metadata: Metadata = {
  title: "Complaints Search",
  description:
    "Browse civic complaints reported across the city. Reporter identities are kept anonymous.",
}

export default function PublicComplaintsPage() {
  const complaints = getPublicComplaints()

  // Fill the viewport below the sticky site header (h-16 / 4rem).
  return (
    <div className="h-[calc(100svh-4rem)] w-full">
      <ComplaintsMapView
        complaints={complaints}
        departments={mockDepartments}
        isPublic
      />
    </div>
  )
}
