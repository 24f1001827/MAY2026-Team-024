import { HomeHero } from "@/features/home/components/home-hero"
import { HomeStats } from "@/features/home/components/home-stats"
import { HomeFeatures } from "@/features/home/components/home-features"

export default function Home() {
  return (
    <div className="w-full px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="space-y-4 sm:space-y-6">
        <HomeHero />
        <HomeStats />
        <HomeFeatures />
      </div>
    </div>
  )
}
