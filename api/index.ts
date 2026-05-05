// Ultra-lightweight Vercel entry point
// Defer all heavy imports to runtime to minimize cold start time

export const config = {
  runtime: "nodejs",
};

let handler: ((req: Request) => Promise<Response>) | null = null;
let handlerPromise: Promise<void> | null = null;

async function initHandler() {
  if (handler) return;
  if (handlerPromise) return handlerPromise;
  
  handlerPromise = (async () => {
    try {
      const { default: app } = await import("./boot.js");
      handler = app.fetch.bind(app);
      console.log("[api/index] Handler initialized");
    } catch (err) {
      console.error("[api/index] Failed to initialize handler:", err);
      handlerPromise = null; // Allow retry
    }
  })();
  
  return handlerPromise;
}

// Start initialization immediately on module load
initHandler();

export default async function(req: Request): Promise<Response> {
  // Wait for handler with timeout (Vercel Hobby plan has ~10s timeout)
  if (!handler) {
    await Promise.race([
      initHandler(),
      new Promise<void>((resolve) => setTimeout(() => {
        if (!handler) {
          console.error("[api/index] Handler init timed out, creating fallback");
          // Create a minimal fallback handler that returns JSON errors
          handler = async (req) => {
            return new Response(
              JSON.stringify({ 
                error: "Server is still starting up. Please try again in a few seconds.",
                code: "SERVER_STARTING"
              }),
              { 
                status: 503,
                headers: { "Content-Type": "application/json" }
              }
            );
          };
        }
        resolve();
      }, 8000)), // Reduced from 20s to 8s to fit within Vercel's 10s limit
    ]);
  }
  
  return handler!(req);
}
