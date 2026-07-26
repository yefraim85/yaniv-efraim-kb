/* ==========================================================================
   יניב אפרים — מאגר ידע אישי
   שרת פיתוח מקומי: מגיש את האתר הסטטי + נקודת שמירה שכותבת קבצים לדיסק.

   מחליף את "npx serve" כדי שמצב הסקירה (assets/js/review.js) יוכל לשמור
   שינויים ישירות לקובץ בלחיצה אחת, בלי שום דיאלוג בדפדפן.

   הרצה:  node tools/dev-server.js       (או דרך .claude/launch.json)
   פורט:  PORT מהסביבה, אחרת 5173.

   נקודת השמירה:
     POST /__save   גוף JSON: { "path": "finance/budget.html", "html": "..." }
     כותב את ה-HTML לקובץ שבנתיב היחסי, רק אם הוא בתוך שורש הפרויקט
     ומסתיים ב-.html. אין תלות בחבילות חיצוניות.
   ========================================================================== */

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = parseInt(process.env.PORT || "5173", 10);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8"
};

// ממפה נתיב יחסי מבוקש לקובץ אמיתי בתוך השורש, או null אם הוא בורח מהשורש.
function resolveWithinRoot(relPath) {
  const clean = decodeURIComponent(relPath.split("?")[0].split("#")[0]);
  const abs = path.resolve(ROOT, "." + path.sep + clean);
  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
  if (abs !== ROOT && !abs.startsWith(rootWithSep)) return null; // מניעת ../
  return abs;
}

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

/* ---------- שמירת קובץ ---------- */
function handleSave(req, res) {
  let raw = "";
  let tooBig = false;
  req.on("data", function (chunk) {
    raw += chunk;
    if (raw.length > 25 * 1024 * 1024) { // תקרת 25MB, בטיחות
      tooBig = true;
      req.destroy();
    }
  });
  req.on("end", function () {
    if (tooBig) return sendJSON(res, 413, { ok: false, error: "too large" });
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return sendJSON(res, 400, { ok: false, error: "invalid JSON" });
    }
    const relPath = data && data.path;
    const html = data && data.html;
    if (typeof relPath !== "string" || typeof html !== "string") {
      return sendJSON(res, 400, { ok: false, error: "missing path/html" });
    }
    if (!/\.html?$/i.test(relPath)) {
      return sendJSON(res, 400, { ok: false, error: "only .html files" });
    }
    const abs = resolveWithinRoot(relPath);
    if (!abs) return sendJSON(res, 403, { ok: false, error: "outside root" });
    if (!fs.existsSync(abs)) {
      return sendJSON(res, 404, { ok: false, error: "file not found: " + relPath });
    }
    fs.writeFile(abs, html, "utf8", function (err) {
      if (err) {
        console.error("שמירה נכשלה:", err);
        return sendJSON(res, 500, { ok: false, error: String(err.message || err) });
      }
      console.log("נשמר ✓ " + relPath);
      sendJSON(res, 200, { ok: true, path: relPath });
    });
  });
}

// מחזיר את הקובץ האמיתי הראשון שקיים, כולל תמיכה ב-URLs "נקיים" (בלי .html)
// ובתיקיות (index.html), כדי להיות תחליף מלא ל-"npx serve".
function findFile(abs) {
  try {
    const stat = fs.statSync(abs);
    if (stat.isFile()) return abs;
    if (stat.isDirectory()) {
      const idx = path.join(abs, "index.html");
      if (fs.existsSync(idx)) return idx;
    }
  } catch (e) { /* לא קיים — ננסה וריאציות */ }
  if (!path.extname(abs)) {
    if (fs.existsSync(abs + ".html")) return abs + ".html";
    const idx = path.join(abs, "index.html");
    if (fs.existsSync(idx)) return idx;
  }
  return null;
}

/* ---------- הגשת קבצים סטטיים ---------- */
function serveStatic(req, res) {
  let urlPath = req.url.split("?")[0];
  if (urlPath === "/") urlPath = "/index.html";

  const abs = resolveWithinRoot(urlPath);
  if (!abs) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  const file = findFile(abs);
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    return res.end("<h1>404</h1><p>" + urlPath + " לא נמצא</p>");
  }

  fs.readFile(file, function (readErr, buf) {
    if (readErr) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      return res.end("<h1>404</h1><p>" + urlPath + " לא נמצא</p>");
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    res.end(buf);
  });
}

/* ---------- ניתוב ---------- */
const server = http.createServer(function (req, res) {
  if (req.method === "POST" && req.url.split("?")[0] === "/__save") {
    return handleSave(req, res);
  }
  if (req.method === "GET" || req.method === "HEAD") {
    return serveStatic(req, res);
  }
  res.writeHead(405);
  res.end("Method Not Allowed");
});

server.listen(PORT, function () {
  console.log("מאגר הידע פועל על http://localhost:" + PORT);
  console.log("שורש: " + ROOT);
  console.log("שמירה חיה פעילה בכתובת POST /__save");
});

server.on("error", function (err) {
  if (err.code === "EADDRINUSE") {
    console.error("פורט " + PORT + " תפוס. עצור את השרת הקודם או הגדר PORT אחר.");
    process.exit(1);
  }
  throw err;
});
