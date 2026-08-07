import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth/current-user"
import { ComplaintsView } from "@/features/complaint/components/complaints-view"
import { publicRoutes } from "@/nav"

export default async function ComplaintsPage() {
  const user = await getCurrentUser()
  if (!user) redirect(publicRoutes.login)

  // Only citizens and admins can file a complaint.
  const canCreate = user.role === "Citizen" || user.role === "Admin"

  // Full-bleed map: cancel the layout's <main> padding and fill the viewport
  // below the 4rem (h-16) dashboard header.
  return (
    <div className="-m-4 h-[calc(100svh-4rem)] sm:-m-6 lg:-m-8">
      <ComplaintsView role={user.role} canCreate={canCreate} />
    </div>
  )
}
