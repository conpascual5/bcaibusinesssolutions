// Ultra-lightweight Vercel entry point
// Defer all heavy imports to runtime to minimize cold start time

export const config = {
  runtime: "nodejs",
};

let handler: ((req: Request) => Promise<Response>) | null = null;
let initPromise: Promise<void> | null = null;

// Start warming up the database immediately when the module loads
// This runs in parallel with the request handling
function startWarmup() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const { default: app } = await import("./boot.js");
        handler = app.fetch.bind(app);
      } catch (err) {
        console.error("[api/index] Warmup failed:", err);
      }
    })();
  }
  return initPromise;
}

// Start warmup immediately on module load (before any request)
startWarmup();

export default async function(req: Request): Promise<Response> {
  // If handler isn't ready yet, wait for warmup
  if (!handler) {
    await startWarmup();
  }
  return handler!(req);
}
