import { redirect } from "next/navigation"

import { AdminDashboard } from "@/features/admin/components/admin-dashboard"
import { getCurrentUser } from "@/lib/auth/current-user"
import { routes } from "@/nav"

export default async function DashboardPage() {
  const currentUser = await getCurrentUser()

  // Citizens don't have a dashboard home — their workflow is the complaints
  // map, so send them straight there.
  if (currentUser?.role === "Citizen") redirect(routes.complaints.href)

  // NOTE: officers are intentionally NOT redirected to /dashboard/department
  // yet. That page still resolves the officer's department from mock data, so a
  // real (backend-authenticated) officer isn't found there and it bounces back
  // here — an infinite redirect loop. Restore this redirect once the officers
  // module is integrated:
  //   if (currentUser?.role === "Officer") redirect(routes.department)

  // Admins get the user-management console as their home.
  if (currentUser?.role === "Admin") {
    return <AdminDashboard name={currentUser.name} />
  }

  const firstName = currentUser?.name.split(" ")[0] ?? "there"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This is your Rastro dashboard. More is on the way.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["Complaints", "Tenders", "Notifications"].map((title) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">Coming soon.</p>
          </div>
        ))}
      </div>
    </div>
  )
}
