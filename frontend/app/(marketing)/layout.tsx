import { SiteHeader } from "@/features/common/components/site-header"
import { SiteFooter } from "@/features/common/components/site-footer"

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  )
}
