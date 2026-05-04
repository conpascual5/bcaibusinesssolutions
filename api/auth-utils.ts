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
      // Try with salt as hex string directly
      const data1 = encoder.encode(password + saltHex);
      const digest1 = await crypto.subtle.digest("SHA-512", data1);
      const computedHex1 = Array.from(new Uint8Array(digest1))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (computedHex1 === hashHex) return true;

      // Try with salt decoded from hex
      const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
      const data2 = new Uint8Array([...saltBytes, ...encoder.encode(password)]);
      const digest2 = await crypto.subtle.digest("SHA-512", data2);
      const computedHex2 = Array.from(new Uint8Array(digest2))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (computedHex2 === hashHex) return true;

      // Try with password + decoded salt bytes
      const data3 = new Uint8Array([...encoder.encode(password), ...saltBytes]);
      const digest3 = await crypto.subtle.digest("SHA-512", data3);
      const computedHex3 = Array.from(new Uint8Array(digest3))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (computedHex3 === hashHex) return true;

      // Try SHA-256 with decoded salt
      const digest4 = await crypto.subtle.digest("SHA-256", data2);
      const computedHex4 = Array.from(new Uint8Array(digest4))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (computedHex4 === hashHex) return true;

      console.log("[verify] All fallback attempts failed");
      console.log("[verify] SHA-512 hex salt:", computedHex1);
      console.log("[verify] SHA-512 decoded salt (pw+salt):", computedHex2);
      console.log("[verify] SHA-512 decoded salt (salt+pw):", computedHex3);
      console.log("[verify] SHA-256 decoded salt:", computedHex4);
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

