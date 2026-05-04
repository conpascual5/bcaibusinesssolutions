// Load dotenv synchronously — only in non-Vercel environments
if (!process.env.VERCEL) {
  try {
    // Use createRequire for ESM compatibility
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const dotenv = require("dotenv");
    dotenv.config();
  } catch {
    // dotenv not available, that's fine
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
