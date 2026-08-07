import { StatusShell } from "@/features/auth/components/status-shell"

/**
 * Layout for the account-status pages (pending / rejected / blocked). Uses the
 * dashboard-style shell but with a nav-less, log-out-only sidebar.
 */
export default function StatusLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <StatusShell>{children}</StatusShell>
}
