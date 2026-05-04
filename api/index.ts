import { handle } from "hono/vercel";
import app from "./boot";

export const config = {
  runtime: "nodejs",
};

// Wrap the handler to catch initialization errors
let handler: ReturnType<typeof handle> | null = null;

try {
  handler = handle(app);
} catch (err: any) {
  console.error("[api/index] Initialization error:", err);
  // Return a proper JSON error response
  handler = handle(
    new (await import("hono")).Hono().onError((err, c) => {
      console.error("[api/index] Error:", err);
      return c.json({ error: err.message || "Internal server error" }, 500);
    })
  );
}

export default async (req: Request, ctx: any) => {
  try {
    if (!handler) throw new Error("Handler not initialized");
    return await handler(req, ctx);
  } catch (err: any) {
    console.error("[api/index] Request error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
