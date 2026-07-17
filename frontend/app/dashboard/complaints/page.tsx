import { cookies } from "next/headers"

import {
  mockComplaints,
  mockDepartments,
  mockUsers,
} from "@/components/shared/mock-data"
import { MOCK_SESSION_COOKIE } from "@/lib/auth/mock-session"
import { enrichComplaints } from "@/lib/utils/complaint/public-complaints"
import { ComplaintsMapView } from "@/features/complaint/components/complaints-map-view"

export default async function ComplaintsPage() {
  const store = await cookies()
  const user = mockUsers.find(
    (u) => u.id === store.get(MOCK_SESSION_COOKIE)?.value
  )
  // Only citizens and admins can file a complaint.
  const canCreate = user?.role === "Citizen" || user?.role === "Admin"

  // Officers see only complaints allotted to them, citizens only the ones they
  // filed; admins (and agencies) see all.
  const visibleComplaints =
    user?.role === "Officer"
      ? mockComplaints.filter((c) => c.assignedOfficerId === user.id)
      : user?.role === "Citizen"
        ? mockComplaints.filter((c) => c.citizenId === user.id)
        : mockComplaints

  const complaints = enrichComplaints(visibleComplaints, mockDepartments)

  // Full-bleed map: cancel the layout's <main> padding and fill the viewport
  // below the 4rem (h-16) dashboard header.
  return (
    <div className="-m-4 h-[calc(100svh-4rem)] sm:-m-6 lg:-m-8">
      <ComplaintsMapView
        complaints={complaints}
        departments={mockDepartments}
        canCreate={canCreate}
      />
    </div>
  )
}
