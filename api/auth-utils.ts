import { env } from "./lib/env.js";

// Simple password hashing using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + env.jwtSecret);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(new Uint8Array(hash)).toString("base64");
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
      const pwBytes = encoder.encode(password);
      const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));

      // Try various combinations
      const attempts: [string, string, Uint8Array][] = [
        ["SHA-512", "hex salt (pw+saltHex)", encoder.encode(password + saltHex)],
        ["SHA-512", "decoded salt (saltBytes+pw)", new Uint8Array([...saltBytes, ...pwBytes])],
        ["SHA-512", "decoded salt (pw+saltBytes)", new Uint8Array([...pwBytes, ...saltBytes])],
        ["SHA-256", "decoded salt (saltBytes+pw)", new Uint8Array([...saltBytes, ...pwBytes])],
        ["SHA-256", "decoded salt (pw+saltBytes)", new Uint8Array([...pwBytes, ...saltBytes])],
        ["SHA-256", "hex salt (pw+saltHex)", encoder.encode(password + saltHex)],
      ];

      for (const [algo, label, data] of attempts) {
        const digest = await crypto.subtle.digest(algo, data as BufferSource);
        const computedHex = Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        console.log(`[verify] ${algo} ${label}: ${computedHex}`);
        if (computedHex === hashHex) return true;
      }

      // Try with Node.js crypto module
      try {
        const { createHash, pbkdf2Sync, scryptSync, createHmac } = await import("node:crypto");
        
        // Try SHA-512 with createHash
        const sha512Hex = createHash("sha512").update(password + saltHex).digest("hex");
        console.log(`[verify] node:sha512 hex salt: ${sha512Hex}`);
        if (sha512Hex === hashHex) return true;

        // Try SHA-512 with decoded salt bytes
        const sha512BytesHex = createHash("sha512").update(Buffer.from(saltBytes)).update(password).digest("hex");
        console.log(`[verify] node:sha512 decoded salt: ${sha512BytesHex}`);
        if (sha512BytesHex === hashHex) return true;

        // Try SHA-512 with password then salt
        const sha512PwSalt = createHash("sha512").update(password).update(saltHex).digest("hex");
        console.log(`[verify] node:sha512 pw+saltHex: ${sha512PwSalt}`);
        if (sha512PwSalt === hashHex) return true;

        // Try HMAC-SHA512 with salt as key
        const hmacHex = createHmac("sha512", saltHex).update(password).digest("hex");
        console.log(`[verify] hmac-sha512: ${hmacHex}`);
        if (hmacHex === hashHex) return true;

        // Try HMAC-SHA512 with decoded salt as key
        const hmacBytesHex = createHmac("sha512", Buffer.from(saltBytes)).update(password).digest("hex");
        console.log(`[verify] hmac-sha512 decoded: ${hmacBytesHex}`);
        if (hmacBytesHex === hashHex) return true;

        // Try PBKDF2 with 1000 iterations
        const pbkdf2Hex = pbkdf2Sync(password, saltHex, 1000, 64, "sha512").toString("hex");
        console.log(`[verify] pbkdf2 1000: ${pbkdf2Hex}`);
        if (pbkdf2Hex === hashHex) return true;

        // Try PBKDF2 with 10000 iterations
        const pbkdf2Hex2 = pbkdf2Sync(password, saltHex, 10000, 64, "sha512").toString("hex");
        console.log(`[verify] pbkdf2 10000: ${pbkdf2Hex2}`);
        if (pbkdf2Hex2 === hashHex) return true;

        // Try PBKDF2 with decoded salt
        const pbkdf2Hex3 = pbkdf2Sync(password, Buffer.from(saltBytes), 1000, 64, "sha512").toString("hex");
        console.log(`[verify] pbkdf2 decoded salt 1000: ${pbkdf2Hex3}`);
        if (pbkdf2Hex3 === hashHex) return true;

        // Try scrypt
        const scryptHex = scryptSync(password, saltHex, 64).toString("hex");
        console.log(`[verify] scrypt: ${scryptHex}`);
        if (scryptHex === hashHex) return true;

        // Try SHA-512 of just the password
        const sha512Pw = createHash("sha512").update(password).digest("hex");
        console.log(`[verify] sha512 pw only: ${sha512Pw}`);
        if (sha512Pw === hashHex) return true;

        // Try SHA-512 of password + jwtSecret
        const { env } = await import("./lib/env.js");
        const sha512Jwt = createHash("sha512").update(password + env.jwtSecret).digest("hex");
        console.log(`[verify] sha512 pw+jwtSecret: ${sha512Jwt}`);
        if (sha512Jwt === hashHex) return true;
      } catch (e) {
        console.log("[verify] node:crypto not available:", e);
      }

      console.log("[verify] stored hashHex:", hashHex);
    }
  }

  return false;
}

// JWT-like token using base64 encoding (simple, no external deps)
export function signJWT(payload: { userId: number; email: string; isAdmin: boolean }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 })).toString("base64url");
  const signature = Buffer.from(env.jwtSecret).toString("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyJWT(token: string): { userId: number; email: string; isAdmin: boolean } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Try base64url first, fall back to base64 (for old tokens)
    let bodyJson: string;
    try {
      bodyJson = Buffer.from(parts[1], "base64url").toString("utf8");
    } catch {
      bodyJson = Buffer.from(parts[1], "base64").toString("utf8");
    }
    const body = JSON.parse(bodyJson);
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: body.userId, email: body.email, isAdmin: body.isAdmin };
  } catch {
    return null;
  }
}

