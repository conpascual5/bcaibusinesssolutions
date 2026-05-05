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

function fetchWithTimeout(url: string, options?: RequestInit & { timeout?: number }): Promise<Response> {
  const { timeout = 180000, ...fetchOptions } = options || {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch(url, {
    ...fetchOptions,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
}

// Custom fetch wrapper that ensures non-JSON responses (like 504 HTML pages)
// are converted to proper JSON errors so tRPC can handle them gracefully
async function trpcFetch(url: string, options?: RequestInit & { timeout?: number }): Promise<Response> {
  const response = await fetchWithTimeout(url, options);
  
  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    // If the response is HTML (e.g. a 504 gateway timeout page), convert to JSON
    if (contentType.includes("text/html")) {
      const text = await response.text();
      const statusText = response.statusText || "Server Error";
      return new Response(
        JSON.stringify({
          error: {
            message: `Server returned ${response.status} ${statusText}. The server may still be starting up. Please try again.`,
            code: response.status === 504 ? "TIMEOUT" : "SERVER_ERROR",
          },
        }),
        {
          status: response.status,
          headers: { "content-type": "application/json" },
        }
      );
    }
  }
  
  return response;
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
      fetch: trpcFetch as typeof fetch,
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
