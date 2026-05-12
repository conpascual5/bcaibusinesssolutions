import { Hono } from "hono";
import { env } from "./lib/env.js";

const app = new Hono();

app.get("/api/samples", async (c) => {
  // On Vercel (serverless) uploaded files are not persisted.
  // Return immediately so the UI doesn't hang.
  if (env.isVercel) {
    return c.json({ images: [] });
  }

  // Fallback behavior for local/dev (keep compatibility)
  return c.json({ images: [] });
});

export default app;
