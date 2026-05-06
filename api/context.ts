import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getSupabaseClient } from "./queries/supabase-client.ts";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user: { userId: string; email: string; isAdmin: boolean } | null;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  let token: string | null = null;

  // Try Authorization header first (case-insensitive)
  const authHeader = opts.req.headers.get("authorization") ?? opts.req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.replace("Bearer ", "").trim();
  }

  // Fallback: cookie
  if (!token) {
    const cookieHeader = opts.req.headers.get("cookie") ?? opts.req.headers.get("Cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/auth-token=([^;]+)/);
      if (match) token = match[1].trim();
    }
  }

  let user: { userId: string; email: string; isAdmin: boolean } | null = null;
  if (token) {
    // Verify the token with Supabase
    const supabase = getSupabaseClient();
    const { data: { user: supaUser }, error } = await supabase.auth.getUser(token);

    if (!error && supaUser) {
      user = {
        userId: supaUser.id,
        email: supaUser.email ?? "",
        isAdmin: false, // Will be checked in middleware
      };
    }
  }

  return { req: opts.req, resHeaders: opts.resHeaders, user };
}
