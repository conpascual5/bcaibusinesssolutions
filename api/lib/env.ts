// Only load dotenv in non-Vercel environments
if (!process.env.VERCEL) {
  const { config } = await import("dotenv");
  config();
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
  databaseUrl: required("DATABASE_URL"),
  falApiKey: process.env.FAL_API_KEY ?? "",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
};
