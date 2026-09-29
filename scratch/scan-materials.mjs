import fs from "fs";
import path from "path";

const targetTerms = ["zari", "golden", "silk"];
const ignoredDirs = ["node_modules", ".next", ".git", ".gemini", "dist"];

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (ignoredDirs.includes(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = walkDir(".");
const results = {};
for (const term of targetTerms) results[term] = [];

for (const filePath of allFiles) {
  if (filePath.includes("scratch")) continue;

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      for (const term of targetTerms) {
        if (line.toLowerCase().includes(term.toLowerCase())) {
          results[term].push({
            file: filePath,
            line: idx + 1,
            text: line.trim(),
          });
        }
      }
    });
  } catch {}
}

console.log("=== FULL REPO SCAN FOR zari, golden, silk ===");
for (const [term, matches] of Object.entries(results)) {
  console.log(`\nTerm: "${term}" (${matches.length} matches)`);
  matches.forEach((m) => {
    console.log(`  ${m.file}:${m.line} -> ${m.text}`);
  });
}
