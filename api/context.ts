import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getSupabaseClient } from "./queries/supabase-client.js";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  token: string | null;
  user: { userId: string; email: string; isAdmin: boolean } | null;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  let token: string | null = null;

  // Try Authorization header first (case-insensitive)
  const authHeader = opts.req.headers.get("authorization") ?? opts.req.headers.get("Authorization");
  console.log("[context] authHeader present:", !!authHeader);
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.replace("Bearer ", "").trim();
    console.log("[context] token from header, length:", token.length);
  }

  // Fallback: cookie
  if (!token) {
    const cookieHeader = opts.req.headers.get("cookie") ?? opts.req.headers.get("Cookie");
    console.log("[context] cookieHeader present:", !!cookieHeader);
    if (cookieHeader) {
      const match = cookieHeader.match(/auth-token=([^;]+)/);
      if (match) {
        token = match[1].trim();
        console.log("[context] token from cookie, length:", token.length);
      }
    }
  }

  let user: { userId: string; email: string; isAdmin: boolean } | null = null;
  if (token) {
    // Verify the token with Supabase using a client that acts as this user
    const supabase = getSupabaseClient(token);
    const { data: { user: supaUser }, error } = await (supabase as any).auth.getUser(token);

    if (error) {
      console.log("[context] getUser error:", error.message);
    }

    if (!error && supaUser) {
      console.log("[context] user found:", supaUser.email);
      user = {
        userId: supaUser.id,
        email: supaUser.email ?? "",
        isAdmin: false, // Will be checked in middleware
      };
    } else {
      console.log("[context] no user from token");
    }
  } else {
    console.log("[context] no token found");
  }

  return { req: opts.req, resHeaders: opts.resHeaders, token, user };
}
