import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, extname } from "path";

const apiDir = join(process.cwd(), "api");

function processFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const updated = content.replace(
    /(from\s+["']\.\/.*?)\.js(["'])/g,
    "$1.ts$2"
  );
  if (content !== updated) {
    writeFileSync(filePath, updated);
    console.log("Fixed:", filePath);
    return true;
  }
  return false;
}

function walkDir(dir) {
  let count = 0;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      count += walkDir(fullPath);
    } else if (entry.isFile() && extname(entry.name) === ".ts") {
      if (processFile(fullPath)) count++;
    }
  }
  return count;
}

console.log("=== Fixing .js imports to .ts in api/ ===");
const fixed = walkDir(apiDir);
console.log("Fixed", fixed, "file(s).");
