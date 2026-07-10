import Link from "next/link"

import { cn } from "@/lib/utils"
import { publicRoutes } from "@/nav"

type LogoSize = "md" | "lg"

const MARK: Record<LogoSize, string> = {
  md: "size-8 rounded-lg text-sm",
  lg: "size-11 rounded-xl text-lg",
}

const WORD: Record<LogoSize, string> = {
  md: "text-lg",
  lg: "text-2xl",
}

export function Logo({
  size = "md",
  href = publicRoutes.home,
}: {
  size?: LogoSize
  href?: string
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5"
      aria-label="Rastro home"
    >
      <span
        className={cn(
          "grid place-items-center bg-primary font-bold text-primary-foreground",
          MARK[size]
        )}
      >
        R
      </span>
      <span
        className={cn("font-bold tracking-tight text-foreground", WORD[size])}
      >
        Rastro
      </span>
    </Link>
  )
}
