"use client"

import { useState } from "react"
import {
  Building03Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  ShieldUserIcon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs"
import { StatCards, type StatItem } from "@/features/admin/components/stat-cards"
import { UsersTable } from "@/features/admin/components/users-table"
import { ApprovalHistory } from "@/features/admin/components/approval-history"
import { useUsers } from "@/hooks/admin-users"

type Tab = "users" | "approvals"

export function AdminDashboard({ name }: { name: string }) {
  const { data, isLoading, isError, error, refetch } = useUsers({})
  const [tab, setTab] = useState<Tab>("users")
  const firstName = name.split(" ")[0] || "there"

  const users = data ?? []
  const approvalRequests = users.filter(
    (u) => u.role === "Officer" || u.role === "Agency",
  )
  const pendingCount = users.filter(
    (u) => u.status === "PendingApproval",
  ).length

  const userStats: StatItem[] = [
    {
      label: "Total Users",
      count: users.length,
      icon: UserGroupIcon,
      description: "across all roles",
      iconBg: "bg-brand/10",
      iconClass: "text-brand",
    },
    {
      label: "Citizens",
      count: users.filter((u) => u.role === "Citizen").length,
      icon: UserIcon,
      description: "registered residents",
      iconBg: "bg-muted",
      iconClass: "text-muted-foreground",
    },
    {
      label: "Officers",
      count: users.filter((u) => u.role === "Officer").length,
      icon: ShieldUserIcon,
      description: "department staff",
      iconBg: "bg-sky-500/10",
      iconClass: "text-sky-600 dark:text-sky-400",
    },
    {
      label: "Agencies",
      count: users.filter((u) => u.role === "Agency").length,
      icon: Building03Icon,
      description: "contractor accounts",
      iconBg: "bg-violet-500/10",
      iconClass: "text-violet-600 dark:text-violet-400",
    },
  ]

  const approvalStats: StatItem[] = [
    {
      label: "Total requests",
      count: approvalRequests.length,
      icon: UserGroupIcon,
      description: "officers + agencies",
      iconBg: "bg-brand/10",
      iconClass: "text-brand",
    },
    {
      label: "Approved",
      count: approvalRequests.filter(
        (u) => u.status === "Active" || u.status === "Blocked",
      ).length,
      icon: CheckmarkCircle02Icon,
      description: "granted access",
      iconBg: "bg-emerald-500/10",
      iconClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Rejected",
      count: approvalRequests.filter((u) => u.status === "Rejected").length,
      icon: CancelCircleIcon,
      description: "denied access",
      iconBg: "bg-destructive/10",
      iconClass: "text-destructive",
    },
    {
      label: "Pending",
      count: pendingCount,
      icon: Clock01Icon,
      description: "awaiting decision",
      iconBg: "bg-amber-500/10",
      iconClass: "text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage user accounts and review registration requests.
        </p>
      </div>

      {isLoading ? (
        <StateCard>Loading users…</StateCard>
      ) : isError ? (
        <StateCard>
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load users."}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </StateCard>
      ) : (
        <>
          {/* Stats reflect the active tab. */}
          <StatCards stats={tab === "users" ? userStats : approvalStats} />

          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="approvals">
                Approvals
                {pendingCount > 0 && (
                  <span className="ml-1 rounded-full bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-6">
              <UsersTable users={users} />
            </TabsContent>

            <TabsContent value="approvals" className="mt-6">
              <ApprovalHistory users={users} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}
