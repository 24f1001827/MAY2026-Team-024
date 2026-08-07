import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  CancelCircleIcon,
  Clock01Icon,
  UserBlock01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { SignOutButton } from "@/features/auth/components/sign-out-button"
import { cn } from "@/lib/utils"
import { publicRoutes } from "@/nav"
import type { AccountStatusReason } from "@/lib/auth/account-status"

type Variant = {
  image: string
  imageWidth: number
  imageHeight: number
  icon: IconSvgElement
  eyebrow: string
  title: string
  description: string
  /** Eyebrow chip colour. */
  accent: string
  /** Soft glow behind the illustration. */
  glow: string
}

const VARIANTS: Record<AccountStatusReason, Variant> = {
  pending: {
    image: "/assets/pending.svg",
    imageWidth: 800,
    imageHeight: 739,
    icon: Clock01Icon,
    eyebrow: "Pending approval",
    title: "Your account is awaiting approval",
    description:
      "Thanks for registering. An administrator needs to approve your account before you can sign in — we'll email you the moment it's ready.",
    accent:
      "bg-amber-500/15 text-amber-700 ring-amber-500/20 dark:text-amber-400",
    glow: "bg-amber-400/20",
  },
  rejected: {
    image: "/assets/rejected.svg",
    imageWidth: 586,
    imageHeight: 659,
    icon: CancelCircleIcon,
    eyebrow: "Registration rejected",
    title: "Your registration wasn't approved",
    description:
      "Unfortunately your registration was rejected, so you can't sign in. If you think this was a mistake, our support team can help.",
    accent: "bg-destructive/10 text-destructive ring-destructive/20",
    glow: "bg-destructive/15",
  },
  blocked: {
    image: "/assets/blocked.svg",
    imageWidth: 799,
    imageHeight: 775,
    icon: UserBlock01Icon,
    eyebrow: "Account blocked",
    title: "Your account has been blocked",
    description:
      "Your account is currently blocked and can't sign in. Please reach out to support if you need help restoring access.",
    accent: "bg-muted text-muted-foreground ring-border",
    glow: "bg-foreground/5",
  },
}

export function AccountStatusCard({ reason }: { reason: AccountStatusReason }) {
  const v = VARIANTS[reason]

  return (
    <div className="mx-auto flex min-h-[calc(100svh-9rem)] w-full max-w-xl flex-col items-center justify-center text-center">
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            "absolute size-56 rounded-full blur-3xl sm:size-72",
            v.glow,
          )}
          aria-hidden
        />
        <Image
          src={v.image}
          alt=""
          width={v.imageWidth}
          height={v.imageHeight}
          priority
          className="relative h-auto w-[200px] sm:w-[260px]"
        />
      </div>

      <span
        className={cn(
          "mt-8 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
          v.accent,
        )}
      >
        <HugeiconsIcon icon={v.icon} className="size-3.5" />
        {v.eyebrow}
      </span>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {v.title}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {v.description}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <SignOutButton variant="brand" size="lg">
          Back to Sign In
        </SignOutButton>
        <Button asChild variant="outline" size="lg">
          <Link href={publicRoutes.support}>Contact Support</Link>
        </Button>
      </div>
    </div>
  )
}
