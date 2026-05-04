import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

try {
  const zip = new AdmZip("BC_AI_New_Site.zip");
  const entries = zip.getEntries();

  console.log("=== Files in the zip ===");
  entries.forEach((entry) => {
    console.log(entry.entryName);
  });

  const extractDir = "kimi-extracted";
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }
  zip.extractAllTo(extractDir, true);
  console.log("\nExtracted to:", extractDir);
  
  // List extracted files
  console.log("\n=== Extracted files ===");
  function listDir(dir, prefix = "") {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        console.log(prefix + file + "/");
        listDir(fullPath, prefix + "  ");
      } else {
        console.log(prefix + file);
      }
    }
  }
  listDir(extractDir);
} catch (err) {
  console.error("Error:", err.message);
}
