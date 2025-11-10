"use client";

import { QueryClient, QueryClientProvider, useIsFetching } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <TopFetchingBar />
      {children}
      <Toaster richColors closeButton />
    </QueryClientProvider>
  );
}

function TopFetchingBar() {
  const fetching = useIsFetching();
  if (!fetching) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div className="h-0.5 w-full animate-pulse bg-black/70" />
    </div>
  );
}
