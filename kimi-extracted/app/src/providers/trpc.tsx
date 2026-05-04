import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Custom fetch with timeout support.
 * Default timeout: 3 minutes for mutations (image generation), 10s for queries.
 */
function fetchWithTimeout(url: string, options?: RequestInit & { timeout?: number }): Promise<Response> {
  const { timeout = 180000, ...fetchOptions } = options || {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch(url, {
    ...fetchOptions,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
}

const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        const token = localStorage.getItem("auth-token");
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
      fetch: fetchWithTimeout as typeof fetch,
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
