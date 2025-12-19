'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes (increased from 1 min for better caching)
            gcTime: 10 * 60 * 1000, // 10 minutes (increased from 5 min)
            refetchOnWindowFocus: false,
            retry: 1,
            // Optimize for WebView performance
            networkMode: 'offlineFirst',
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
