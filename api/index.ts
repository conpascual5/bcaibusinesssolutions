// Vercel serverless entry point
// Direct import — Vercel's esbuild will bundle everything into a single file
import app from "./boot";

export const config = {
  runtime: "nodejs",
};

export default app.fetch;
