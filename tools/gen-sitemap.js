// Generates sitemap.xml from every page's data-updated attribute.
// Run manually with: node tools/gen-sitemap.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BASE_URL = "https://yefraim85.github.io/yaniv-efraim-kb/";

const HEBREW_MONTHS = {
  "בינואר": "01", "בפברואר": "02", "במרץ": "03", "באפריל": "04",
  "במאי": "05", "ביוני": "06", "ביולי": "07", "באוגוסט": "08",
  "בספטמבר": "09", "באוקטובר": "10", "בנובמבר": "11", "בדצמבר": "12",
};

function hebrewDateToIso(hebrewDate) {
  const match = hebrewDate.match(/^(\d{1,2}) (ב\S+) (\d{4})$/);
  if (!match) return null;
  const [, day, monthWord, year] = match;
  const month = HEBREW_MONTHS[monthWord];
  if (!month) return null;
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "templates" || entry.name === "node_modules" || entry.name === ".git" || entry.name === "tools") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.name.endsWith(".html") && entry.name !== "404.html") {
      files.push(full);
    }
  }
  return files;
}

const pages = walk(ROOT).sort();

const urls = pages.map((filePath) => {
  const relPath = path.relative(ROOT, filePath).split(path.sep).join("/");
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/data-updated="([^"]+)"/);
  const iso = match ? hebrewDateToIso(match[1]) : null;
  const loc = relPath === "index.html" ? BASE_URL : BASE_URL + relPath;
  return { loc, lastmod: iso };
});

const missing = urls.filter((u) => !u.lastmod);
if (missing.length) {
  console.error("Missing/unparseable data-updated for:", missing.map((u) => u.loc));
  process.exit(1);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`)
  .join("\n")}\n</urlset>\n`;

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");
console.log(`Wrote sitemap.xml with ${urls.length} URLs.`);
