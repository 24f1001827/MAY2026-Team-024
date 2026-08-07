import { redirect } from "next/navigation"

import { ComplaintDetailView } from "@/features/complaint/components/complaint-detail-view"
import { getCurrentUser } from "@/lib/auth/current-user"
import { publicRoutes } from "@/nav"

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) redirect(publicRoutes.login)

  return (
    <ComplaintDetailView
      id={id}
      currentRole={user.role}
      currentUserId={user.id}
      currentUserName={user.name}
    />
  )
}
