"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is fresh for 60s; avoids redundant refetches on fast nav.
            staleTime: 60 * 1000,
            // Keep unused cache for 5min for instant back-navigation.
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
