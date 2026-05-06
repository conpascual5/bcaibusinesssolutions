// Vercel serverless entry point
// This file is bundled by esbuild (scripts/build-api.mjs) into api/index.js
// esbuild resolves all .ts imports and bundles everything into a single file

import app from "./boot.js";

export const config = {
  runtime: "nodejs",
};

export default app.fetch;
