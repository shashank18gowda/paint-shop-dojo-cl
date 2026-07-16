"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { IdleGuard } from "./components/IdleGuard";
import KioskGuard from "./components/KioskGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <KioskGuard>{children}</KioskGuard>
      <IdleGuard />
    </QueryClientProvider>
  );
}
