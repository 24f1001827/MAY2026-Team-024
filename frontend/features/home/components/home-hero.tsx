import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, CommentAdd01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"

export function HomeHero() {
  return (
    <section className="rounded-3xl border border-border bg-card px-6 py-12 sm:px-12 sm:py-16">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand">
        Complaint Tracking
      </span>
      <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
        Resolve complaints faster, with nothing falling through the cracks.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        Log issues in seconds, route them to the right team, and track every
        case from submission to resolution — all in one place.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="brand" size="lg">
          <Link href="/complaints/create">
            <HugeiconsIcon icon={CommentAdd01Icon} />
            Submit a complaint
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/complaints">
            Track status
            <HugeiconsIcon icon={ArrowRight01Icon} />
          </Link>
        </Button>
      </div>
    </section>
  )
}
