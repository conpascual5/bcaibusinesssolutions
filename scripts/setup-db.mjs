// Run with: node scripts/setup-db.mjs
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

console.log("=== Step 1: Pushing Drizzle schema to database ===");
try {
  execSync("npx --yes drizzle-kit push", { cwd: root, stdio: "inherit" });
  console.log("Schema pushed successfully!");
} catch (err) {
  console.error("Failed to push schema:", err.message);
  process.exit(1);
}

console.log("\n=== Step 2: Seeding database ===");
try {
  execSync("npx tsx db/seed.ts", { cwd: root, stdio: "inherit" });
  console.log("Database seeded successfully!");
} catch (err) {
  console.error("Failed to seed database:", err.message);
  process.exit(1);
}

console.log("\n✅ Database setup complete!");
