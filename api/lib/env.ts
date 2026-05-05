// Synchronous env loader — no top-level await, no fs imports
// On Vercel, env vars are already set by the platform
// In development, Vite's loadEnv populates process.env before the server starts

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
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
};
