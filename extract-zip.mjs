import { execSync } from "child_process";
import AdmZip from "adm-zip";
import fs from "fs";

// First try to list zip contents using system unzip
try {
  const result = execSync('powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead(\'BC_AI_New_Site.zip\'); $zip.Entries | ForEach-Object { $_.FullName }; $zip.Dispose()"', { encoding: "utf8", timeout: 10000 });
  console.log("=== Files in the zip ===");
  console.log(result);
} catch (e) {
  console.log("PowerShell approach failed:", e.message);
}

// Try adm-zip
try {
  const zip = new AdmZip("BC_AI_New_Site.zip");
  const entries = zip.getEntries();
  console.log("\n=== Files via adm-zip ===");
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
  console.error("adm-zip error:", err.message);
}
