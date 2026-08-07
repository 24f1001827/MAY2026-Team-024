"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/shadcn/button"
import { useLogout } from "@/hooks/auth"
import { publicRoutes } from "@/nav"

/**
 * A button that clears any session and returns to the login page. Used by the
 * account-status pages so "Back to sign in" leaves a clean slate (these users
 * usually have no active session — the login 403'd — so logout is defensive).
 */
export function SignOutButton({
  children,
  variant = "brand",
  size = "lg",
  className,
}: {
  children: React.ReactNode
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  className?: string
}) {
  const router = useRouter()
  const logout = useLogout()

  function handleClick() {
    logout.mutate(undefined, {
      onSettled: () => {
        router.push(publicRoutes.login)
        router.refresh()
      },
    })
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={logout.isPending}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}
