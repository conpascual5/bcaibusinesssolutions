import { handle } from "hono/vercel";
import app from "./boot.js";

export const config = {
  runtime: "nodejs",
};

export default handle(app);
