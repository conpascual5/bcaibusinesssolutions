// Ultra-lightweight Vercel entry point
// Defer all heavy imports to runtime to minimize cold start time

export const config = {
  runtime: "nodejs",
};

let handler: ((req: Request) => Promise<Response>) | null = null;

export default async function(req: Request): Promise<Response> {
  if (!handler) {
    // Lazy-load the app on first request
    const { default: app } = await import("./boot.js");
    handler = app.fetch.bind(app);
  }
  return handler(req);
}
