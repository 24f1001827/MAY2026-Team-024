import Link from "next/link"

import { Logo } from "@/features/common/components/logo"
import { publicRoutes } from "@/nav"

const LINKS = [
  { label: "About", href: publicRoutes.about },
  { label: "Support", href: publicRoutes.support },
  { label: "Contact", href: publicRoutes.contact },
]

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="flex w-full flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8 md:flex-row md:items-start md:gap-16">
        <div className="max-w-sm">
          <Logo size="lg" />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            A simple way to log, track, and resolve complaints — keeping every
            case moving from submission to resolution.
          </p>
        </div>

        <nav className="flex flex-col gap-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-border px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Rastro. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
