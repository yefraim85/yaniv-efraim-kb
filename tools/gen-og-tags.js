// Injects static Open Graph / Twitter Card meta tags into every page's <head>,
// mirroring the page's own <title> and <meta name="description">.
// These must be static (not JS-injected) because link-preview crawlers
// (WhatsApp, Slack, iMessage, Facebook) generally don't execute JavaScript.
// Run manually with: node tools/gen-og-tags.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BASE_URL = "https://yefraim85.github.io/yaniv-efraim-kb/";
const SITE_NAME = "יניב אפרים — מאגר ידע אישי";

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

function escapeAttr(str) {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

const pages = walk(ROOT).sort();
let changed = 0;
let skipped = 0;

for (const filePath of pages) {
  const relPath = path.relative(ROOT, filePath).split(path.sep).join("/");
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes('property="og:title"')) {
    skipped++;
    continue;
  }

  const titleMatch = content.match(/<title>([^<]*)<\/title>/);
  const descMatch = content.match(/<meta name="description" content="([^"]*)"\s*\/?>/);
  if (!titleMatch || !descMatch) {
    console.error(`Skipping ${relPath}: missing <title> or meta description`);
    continue;
  }

  const title = titleMatch[1];
  const description = descMatch[1];
  const url = relPath === "index.html" ? BASE_URL : BASE_URL + relPath;
  const ogType = path.basename(relPath) === "index.html" ? "website" : "article";

  const ogBlock = [
    `  <meta property="og:type" content="${ogType}" />`,
    `  <meta property="og:site_name" content="${escapeAttr(SITE_NAME)}" />`,
    `  <meta property="og:locale" content="he_IL" />`,
    `  <meta property="og:url" content="${url}" />`,
    `  <meta property="og:title" content="${escapeAttr(title)}" />`,
    `  <meta property="og:description" content="${escapeAttr(description)}" />`,
    `  <meta name="twitter:card" content="summary" />`,
    `  <meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `  <meta name="twitter:description" content="${escapeAttr(description)}" />`,
  ].join("\n");

  const descLine = descMatch[0];
  content = content.replace(descLine, `${descLine}\n${ogBlock}`);

  fs.writeFileSync(filePath, content, "utf8");
  changed++;
}

console.log(`Updated ${changed} pages, skipped ${skipped} already-tagged pages.`);
