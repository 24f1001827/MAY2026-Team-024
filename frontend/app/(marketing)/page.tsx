import { HomeHero } from "@/features/home/components/home-hero"
import { HomeFlow } from "@/features/home/components/home-flow"
import { HomeRoles } from "@/features/home/components/home-roles"
import { HomeStats } from "@/features/home/components/home-stats"

export default function Home() {
  return (
    <div className="w-full px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="space-y-10 sm:space-y-14">
        <HomeHero />
        <HomeFlow />
        <HomeRoles />
        <HomeStats />
      </div>
    </div>
  )
}
