import { env } from "./lib/env.js";

// Simple password hashing using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + env.jwtSecret);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Try current hashing method first
  const computed = await hashPassword(password);
  if (computed === hash) return true;

  // Fallback: check if hash is in old hex format (salt:hash) using SHA-512
  if (hash.includes(":")) {
    const [saltHex, hashHex] = hash.split(":");
    if (saltHex && hashHex) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + saltHex);
      const digest = await crypto.subtle.digest("SHA-512", data);
      const computedHex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return computedHex === hashHex;
    }
  }

  return false;
}

// JWT-like token using base64 encoding (simple, no external deps)
export function signJWT(payload: { userId: number; email: string; isAdmin: boolean }): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 }));
  const signature = btoa(env.jwtSecret);
  return `${header}.${body}.${signature}`;
}

export function verifyJWT(token: string): { userId: number; email: string; isAdmin: boolean } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const body = JSON.parse(atob(parts[1]));
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: body.userId, email: body.email, isAdmin: body.isAdmin };
  } catch {
    return null;
  }
}

