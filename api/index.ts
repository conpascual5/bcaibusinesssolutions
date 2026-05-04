import { handle } from "hono/vercel";
import app from "./boot.js";

export const config = {
  runtime: "nodejs",
};

// Wrap with handle() for proper Vercel integration
export default handle(app);
