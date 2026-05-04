import { createHash, randomBytes, pbkdf2Sync } from "crypto";
import { env } from "./lib/env";

// --- Password Hashing ---
const SALT_LEN = 16;
const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = "sha256";

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString("hex");
  return computed === hash;
}

// --- Simple JWT (HS256) ---
function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(data: string): string {
  const padding = "=".repeat((4 - (data.length % 4)) % 4);
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/") + padding, "base64").toString("utf8");
}

export type JWTPayload = {
  userId: number;
  email: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
};

export function signJWT(payload: Omit<JWTPayload, "iat" | "exp">, expiresInHours = 168): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64UrlEncode(
    JSON.stringify({ ...payload, iat: now, exp: now + expiresInHours * 3600 })
  );
  const signature = createHash("sha256")
    .update(`${header}.${body}.${env.jwtSecret}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expected = createHash("sha256")
      .update(`${header}.${body}.${env.jwtSecret}`)
      .digest("base64url");
    if (signature !== expected) return null;
    const payload: JWTPayload = JSON.parse(base64UrlDecode(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
