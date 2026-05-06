import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    // If the response is not JSON (e.g. a 504 gateway timeout HTML page), convert to JSON
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      const statusText = response.statusText || "Server Error";
      // Extract a short preview from HTML error pages
      const preview = text.length > 200 ? text.substring(0, 200) + "..." : text;
      return new Response(
        JSON.stringify({
          error: {
            message: `Server returned ${response.status} ${statusText}. The server may still be starting up. Please try again.`,
            code: response.status === 504 ? "TIMEOUT" : "SERVER_ERROR",
            detail: preview,
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
        // Use Supabase session access token
        const supabaseToken = (() => {
          try {
            // Supabase v2 stores the session in localStorage under sb-<project-ref>-auth-token
            // Try all possible keys
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.includes("auth-token")) {
                const raw = localStorage.getItem(key);
                if (raw) {
                  const parsed = JSON.parse(raw);
                  // Try different formats
                  if (parsed?.access_token) return parsed.access_token;
                  if (parsed?.currentSession?.access_token) return parsed.currentSession.access_token;
                }
              }
            }
          } catch {}
          return null;
        })();
        
        return supabaseToken ? { Authorization: `Bearer ${supabaseToken}` } : {};
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
