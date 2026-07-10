import { cookies } from "next/headers"

import { mockUsers } from "@/components/shared/mock-data"
import { MOCK_SESSION_COOKIE } from "@/lib/auth/mock-session"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const uid = cookieStore.get(MOCK_SESSION_COOKIE)?.value
  const currentUser = mockUsers.find((u) => u.id === uid)
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
