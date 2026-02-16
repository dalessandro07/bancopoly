"use client"

import { RealtimeProvider } from "@/src/core/lib/realtime-client"

export function Providers({ children }: { children: React.ReactNode }) {
  return <RealtimeProvider>{children}</RealtimeProvider>
}
