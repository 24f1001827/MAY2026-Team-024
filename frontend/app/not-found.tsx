import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Compass01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/shadcn/button"
import { publicRoutes } from "@/nav"

/**
 * Root 404. Renders for two cases (see `not-found.js` docs): any URL that
 * matches no route, and `notFound()` thrown by a segment without a closer
 * not-found file — e.g. `ComplaintDetailView` when the API 404s.
 *
 * Because unauthenticated visitors land here too, the actions stay public
 * (home / support) rather than linking into the dashboard, which would just
 * bounce a signed-out user back to login.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col items-center justify-center px-6 text-center">
      <div className="relative flex items-center justify-center">
        <div
          className="absolute size-56 rounded-full bg-brand/20 blur-3xl sm:size-72"
          aria-hidden
        />
        <p className="relative text-[5.5rem] font-bold leading-none tracking-tighter text-brand sm:text-[7rem]">
          404
        </p>
      </div>

      <span className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand ring-1 ring-inset ring-brand/20">
        <HugeiconsIcon icon={Compass01Icon} className="size-3.5" />
        Page not found
      </span>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The page you&apos;re looking for may have been moved, or the complaint
        you opened no longer exists. Check the link and try again.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="brand" size="lg">
          <Link href={publicRoutes.home}>Back to Home</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={publicRoutes.support}>Contact Support</Link>
        </Button>
      </div>
    </main>
  )
}
