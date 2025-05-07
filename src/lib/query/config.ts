import { QueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable automatic refetching when window is focused
      refetchOnWindowFocus: false,
      // Keep data fresh for 1 minute
      staleTime: 60 * 1000,
      // Only run queries on client side
      enabled: browser
    }
  }
}); 