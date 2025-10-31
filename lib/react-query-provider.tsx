'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * React Query Provider Component
 *
 * Wraps the application with React Query context and provides:
 * - Automatic caching and refetching
 * - Background updates
 * - Optimistic updates
 * - DevTools for debugging (development only)
 */
export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // Create a client instance per component mount
  // This ensures client is created in browser, not during SSR
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes by default
            staleTime: 5 * 60 * 1000,

            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,

            // Retry failed requests 3 times
            retry: 3,

            // Refetch on window focus (keep data fresh)
            refetchOnWindowFocus: true,

            // Refetch on reconnect
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show DevTools in development only */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
