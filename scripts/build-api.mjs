// Build the API server for Vercel deployment
// Compiles TypeScript files in api/ to JavaScript in dist/api/
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

console.log("=== Building API server for Vercel ===");

// Use esbuild to compile the API TypeScript files
try {
  execSync(
    `npx esbuild api/index.ts --bundle --platform=node --target=node20 --outfile=dist/api/index.js --external:@hono/node-server --external:@trpc/server --external:@supabase/supabase-js --external:hono --external:zod --external:superjson --external:openai --external:@fal-ai/client --external:bcryptjs --external:dotenv --external:drizzle-orm --external:@libsql/client --external:@neondatabase/serverless --external:postgres --external:mysql2 --external:better-sqlite3 --external:sql.js --external:html2canvas --external:jspdf --external:recharts --external:date-fns --external:react --external:react-dom --format=esm`,
    { cwd: root, stdio: "inherit" }
  );
  console.log("API server built successfully!");
} catch (err) {
  console.error("Failed to build API server:", err.message);
  process.exit(1);
}
