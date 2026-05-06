// Build API server for Vercel deployment
// Uses Vercel's Build Output API (v3) to define the serverless function
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";
import { existsSync, mkdirSync, writeFileSync, cpSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

console.log("=== Building API server for Vercel ===");

// 1. Bundle the API into a single file
const funcDir = join(root, ".vercel", "output", "functions", "api", "index.func");
if (!existsSync(funcDir)) {
  mkdirSync(funcDir, { recursive: true });
}

const outfile = join(funcDir, "index.js");

try {
  execSync(
    `npx esbuild api/index.ts --bundle --platform=node --target=node20 --format=esm ` +
    `--outfile="${outfile}" ` +
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
  console.log("API server bundled to:", outfile);
} catch (err) {
  console.error("Failed to build API server:", err.message);
  process.exit(1);
}

// 2. Write the .vc-config.json for the function
writeFileSync(
  join(funcDir, ".vc-config.json"),
  JSON.stringify({
    runtime: "nodejs20.x",
    handler: "index.js",
    launcherType: "Nodejs",
    shouldAddHelpers: true,
    shouldAddSourcemapSupport: false,
    maxDuration: 60,
    memory: 512,
    regions: ["sin1"],
  }, null, 2)
);

console.log("Written .vc-config.json");

// 3. Copy frontend build output to .vercel/output/static
const staticDir = join(root, ".vercel", "output", "static");
const distPublic = join(root, "dist", "public");
if (existsSync(distPublic)) {
  if (!existsSync(staticDir)) {
    mkdirSync(staticDir, { recursive: true });
  }
  cpSync(distPublic, staticDir, { recursive: true });
  console.log("Copied frontend build to .vercel/output/static");
} else {
  console.warn("Warning: dist/public not found — frontend may not have been built yet");
}

// 4. Write the build output config
const outputDir = join(root, ".vercel", "output");
writeFileSync(
  join(outputDir, "config.json"),
  JSON.stringify({
    version: 3,
    routes: [
      { src: "^/api/(.*)", dest: "/api/index" },
      { src: "^/((?!api/).*)$", dest: "/index.html" },
    ],
  }, null, 2)
);

console.log("Written .vercel/output/config.json");
console.log("API server build complete!");
