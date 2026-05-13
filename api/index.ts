// Vercel serverless entry point
// This file is bundled by esbuild (scripts/build-api.mjs) into api/index.js
// For Vercel, we import boot.ts directly (Vercel compiles .ts files automatically)

import app from "./boot";

export const config = {
  runtime: "nodejs",
};

export default app.fetch;
