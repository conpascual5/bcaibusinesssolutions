import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { verifyJWT } from "./auth-utils.js";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user: { userId: number; email: string; isAdmin: boolean } | null;
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

  let user: { userId: number; email: string; isAdmin: boolean } | null = null;
  if (token) {
    const payload = verifyJWT(token);
    if (payload) {
      user = { userId: payload.userId, email: payload.email, isAdmin: payload.isAdmin };
    }
  }

  return { req: opts.req, resHeaders: opts.resHeaders, user };
}
