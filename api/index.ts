import app from "./boot.js";

export const config = {
  runtime: "nodejs",
};

// Vercel expects the default export to be a request handler
export default app.fetch;
