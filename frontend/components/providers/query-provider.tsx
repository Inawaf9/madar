"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  }));
  return <QueryClientProvider client={client}>{children}<Toaster toastOptions={{ style: { fontFamily: "var(--font-thmanyah-sans)", background: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)" } }} /></QueryClientProvider>;
}
