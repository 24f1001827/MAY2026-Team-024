"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"

/**
 * Toggles between light and dark themes via next-themes (which manages the
 * `.dark` class on <html>). Renders a neutral placeholder until mounted to
 * avoid a hydration mismatch, since the resolved theme is only known client-side.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {mounted && (
        <HugeiconsIcon icon={isDark ? Sun03Icon : Moon02Icon} />
      )}
    </Button>
  )
}
