// Build API server for Vercel deployment
// Bundles all TypeScript files into a single output file
// This avoids module resolution issues with .js → .ts imports on Vercel
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

console.log("=== Building API server for Vercel ===");

// Use esbuild to bundle api/index.ts into a single file
// --bundle: resolve all imports into a single output file
// --platform=node: target Node.js runtime
// --target=node20: match Vercel's Node.js version
// --format=esm: use ES modules
// --outfile=api/index.js: output to api/index.js (Vercel looks for this)
// --external: don't bundle node_modules (Vercel provides them)
try {
  execSync(
    `npx esbuild api/index.ts --bundle --platform=node --target=node20 --format=esm --outfile=api/index.js ` +
    `--external:hono ` +
    `--external:@trpc/server ` +
    `--external:@supabase/supabase-js ` +
    `--external:zod ` +
    `--external:superjson ` +
    `--external:openai ` +
    `--external:@fal-ai/client ` +
    `--external:bcryptjs ` +
    `--external:dotenv`,
    { cwd: root, stdio: "inherit", shell: true }
  );
  console.log("API server built successfully!");
} catch (err) {
  console.error("Failed to build API server:", err.message);
  process.exit(1);
}
