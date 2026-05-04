import { env } from "./lib/env.js";

// Simple password hashing using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + env.jwtSecret);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
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

