"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LockPasswordIcon,
  Mail01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { Input } from "@/components/shadcn/input"
import { Checkbox } from "@/components/shadcn/checkbox"
import { AuthShell, AuthAside } from "@/features/auth/components/auth-shell"
import { mockUsers } from "@/components/shared/mock-data"
import { setMockSession } from "@/lib/auth/mock-session"
import { toast } from "@/lib/styles/toast-styles"
import { publicRoutes, routes } from "@/nav"

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // TODO: replace with real auth. For now, match a mock user by email so the
    // dashboard reflects that user's role.
    const data = new FormData(event.currentTarget)
    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase()
    const user = mockUsers.find((u) => u.email.toLowerCase() === email)

    if (!user) {
      toast.error("No account found", {
        description: "Check your email, or register a new account.",
      })
      return
    }

    setMockSession(user.id)
    toast.success("Signed in", { description: `Welcome back, ${user.name}.` })
    router.push(routes.href)
  }

  return (
    <AuthShell
      aside={
        <AuthAside
          eyebrow="Welcome back"
          title="Pick up right where you left off."
          description="Sign in to raise complaints, review cases, and manage tenders — all in one place."
        />
      }
    >
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Sign in
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your details to access your Rastro account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <HugeiconsIcon
                icon={Mail01Icon}
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <Link
                href={publicRoutes.forgotPassword}
                className="text-xs font-medium text-brand transition-opacity hover:opacity-80"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <HugeiconsIcon
                icon={LockPasswordIcon}
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="px-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
              >
                <HugeiconsIcon
                  icon={showPassword ? ViewOffSlashIcon : ViewIcon}
                  className="size-4"
                />
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox name="remember" />
            Remember me
          </label>

          <Button type="submit" variant="brand" size="lg" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={publicRoutes.register}
            className="font-medium text-brand transition-opacity hover:opacity-80"
          >
            Register
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
