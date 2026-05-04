import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Synchronous env loader — no top-level await
// On Vercel, env vars are already set by the platform
// In development, we load .env file synchronously

// Only load .env in non-Vercel environments
if (!process.env.VERCEL) {
  try {
    const envPath = resolve(process.cwd(), ".env");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const eqIndex = trimmed.indexOf("=");
          if (eqIndex > 0) {
            const key = trimmed.slice(0, eqIndex).trim();
            const value = trimmed.slice(eqIndex + 1).trim();
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      }
    }
  } catch {
    // Silently fail — env vars should already be set
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  jwtSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  isVercel: !!process.env.VERCEL,
  databaseUrl: process.env.DATABASE_URL ?? "",
  falApiKey: process.env.FAL_API_KEY ?? "",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
};
