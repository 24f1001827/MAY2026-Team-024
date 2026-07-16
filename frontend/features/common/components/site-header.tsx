import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { BellIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { Logo } from "@/features/common/components/logo"
import { ThemeToggle } from "@/features/common/components/theme-toggle"
import { RegisterMenu } from "@/features/auth/components/register-menu"
import { publicRoutes } from "@/nav"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <Logo />

          <nav className="hidden items-center gap-1 sm:flex">
            <Button asChild variant="ghost" size="lg">
              <Link href={publicRoutes.home}>Home</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href={publicRoutes.complaints}>Search Complaints</Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="relative"
          >
            <HugeiconsIcon icon={BellIcon} />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand" />
          </Button>

          <ThemeToggle />

          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

          <Button asChild variant="ghost" size="lg">
            <Link href={publicRoutes.login}>Login</Link>
          </Button>
          <RegisterMenu />
        </div>
      </div>
    </header>
  )
}
