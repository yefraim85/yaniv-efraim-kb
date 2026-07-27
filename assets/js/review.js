/* ==========================================================================
   יניב אפרים — מאגר ידע אישי
   מצב סקירה (Review Mode) — סרגל עריכה חי מעל הכתבה.

   נטען אוטומטית בכל דף דרך nav.js. מוסיף כפתור "עיפרון" קטן בפינה, שפותח
   סרגל עם ארבע פעולות:
     • עריכה חיה   — הופך את גוף הכתבה לניתן לעריכה ישירות בדפדפן.
     • הוסף הערה   — לוחצים על פסקה/כותרת ומתווסף לה פתק צהוב לכתיבת הערה.
     • סמן מיותר   — לוחצים על פסקה/כותרת כדי לסמן אותה כמיותרת (קו חוצה אדום).
     • שמור קובץ   — כותב את ה-HTML המעודכן חזרה לקובץ דרך File System Access
                     API (עובד ב-Chrome/Edge מעל localhost/https). אם ה-API
                     לא זמין — מוריד את הקובץ במקום.

   כל אלמנטי הממשק מסומנים ב-class "kb-review-ui" ומוסרים בעת השמירה, כך
   שהקובץ הנשמר נקי — נשארות בו רק ההערות (aside.kb-note) והסימונים
   (.kb-redundant), שגם מקבלים עיצוב קבוע מכאן.
   ========================================================================== */

(function () {
  "use strict";

  // נטען פעם אחת בלבד לכל דף.
  if (window.__kbReviewLoaded) return;
  window.__kbReviewLoaded = true;

  var EDITABLE_SELECTOR = ".article-body"; // גוף המאמר — נערך כבלוק אחד
  var BLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, li, blockquote";

  // אלמנטים שהופכים לניתנים לעריכה במצב "עריכה חיה": גוף המאמר, וגם
  // הכותרת, פסקת התיאור (lede/eyebrow) והתקצירים בכרטיסים של דפי הקטגוריה.
  // הוספת סלקטור כאן מספיקה — הסימון הוויזואלי מתווסף אוטומטית.
  var EDIT_TARGETS = [
    ".article-body",
    ".article-header h1",
    ".article-header .eyebrow",
    ".hero h1",
    ".hero .lede",
    ".hero .eyebrow",
    ".card h3",
    ".card p",
    ".article-meta > span",      // שורת "עודכן לאחרונה" של המאמר (בכותרת)
    ".section-head h2",          // כותרת ביניים, למשל "עמודים בקטגוריה זו"
    ".section-head .muted"       // מונה העמודים שלצידה
    // הערה: הפוטר אינו ברשימה — הוא מוזרק ע"י nav.js ונמחק בשמירה, כך
    // שעריכתו לא הייתה נשמרת. תאריך העדכון נערך דרך התכונה data-updated.
  ].join(",");

  // אזורים שבהם לחיצה מוסיפה הערה / מסמנת כמיותר.
  var PICK_ZONE_SELECTOR = ".article-body, .hero, .card";

  var state = { mode: null, dirty: false }; // dirty = יש שינויים שלא נשמרו
  var rootDir = null; // FileSystemDirectoryHandle לתיקיית שורש האתר

  /* ---------- עיצוב (מוזרק פעם אחת, קיים בכל טעינה של הדף) ---------- */
  function injectStyle() {
    if (document.getElementById("kb-review-style")) return;

    // BLOCK_SELECTOR הוא רשימה מופרדת בפסיקים — חייבים להוסיף את הקידומת
    // לכל חלק בנפרד, אחרת רק החלק הראשון מקבל אותה והשאר הופכים גלובליים.
    // בגוף המאמר וב-hero מדגישים בלוקים; כרטיס שלם מודגש כיחידה אחת.
    var pickParts = [];
    [".article-body", ".hero"].forEach(function (zone) {
      BLOCK_SELECTOR.split(",").forEach(function (b) {
        pickParts.push(".kb-picking " + zone + " " + b.trim());
      });
    });
    pickParts.push(".kb-picking .card");
    var pickCursor = pickParts.join(",");
    var pickHover = pickParts.map(function (s) { return s + ":hover"; }).join(",");

    var css = [
      /* פתקי הערות ותצוגת "מיותר" — נשארים גם לאחר השמירה */
      ".kb-note{display:block;margin:14px 0;padding:14px 16px;border-radius:12px;",
      "background:#fff8dd;border:1px solid #ecd98a;color:#3a3320;box-shadow:0 2px 10px rgba(0,0,0,.06);",
      "font-family:'Assistant',system-ui,sans-serif;line-height:1.6;}",
      "[data-theme=light] .kb-note{background:#fffbe9;}",
      ".kb-note-num{font-weight:700;font-size:.82rem;color:#8a6d1a;margin-bottom:6px;",
      "display:flex;align-items:center;justify-content:space-between;gap:8px;}",
      ".kb-note-body{min-height:1.4em;outline:none;white-space:pre-wrap;}",
      ".kb-note-body:empty::before{content:'כתוב הערה…';color:#b09a55;}",
      ".kb-note-del{all:unset;cursor:pointer;color:#b23b3b;font-weight:700;font-size:1rem;",
      "line-height:1;padding:0 4px;border-radius:6px;}",
      ".kb-note-del:hover{background:rgba(178,59,59,.12);}",
      ".kb-redundant{position:relative;text-decoration:line-through;",
      "text-decoration-color:rgba(200,45,45,.75);text-decoration-thickness:2px;",
      "background:rgba(220,60,60,.08);border-radius:6px;opacity:.72;}",

      /* סרגל וממשק — מוסרים בעת שמירה */
      ".kb-launcher{position:fixed;bottom:20px;left:20px;z-index:9998;width:46px;height:46px;",
      "border-radius:50%;border:none;cursor:pointer;background:#2f6b4f;color:#fff;font-size:1.15rem;",
      "box-shadow:0 4px 16px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;",
      "transition:transform .15s ease;}",
      ".kb-launcher:hover{transform:scale(1.08);}",
      ".kb-launcher.hidden{display:none;}",

      ".kb-toolbar{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;",
      "direction:rtl;background:#1e2430;color:#fff;border-radius:16px;padding:12px 14px;",
      "box-shadow:0 10px 40px rgba(0,0,0,.35);max-width:calc(100vw - 24px);",
      "font-family:'Assistant',system-ui,sans-serif;}",
      ".kb-toolbar.hidden{display:none;}",
      ".kb-toolbar-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;}",
      ".kb-btn{all:unset;cursor:pointer;box-sizing:border-box;padding:9px 14px;border-radius:10px;",
      "font-weight:700;font-size:.9rem;display:inline-flex;align-items:center;gap:6px;color:#fff;",
      "transition:filter .15s ease,box-shadow .15s ease;white-space:nowrap;}",
      ".kb-btn:hover{filter:brightness(1.1);}",
      ".kb-btn.on{box-shadow:0 0 0 2px #fff,0 0 0 4px rgba(255,255,255,.35);}",
      ".kb-btn-edit{background:#2f9e6a;}",
      ".kb-btn-comment{background:#d98a2b;}",
      ".kb-btn-redundant{background:#c8483f;}",
      ".kb-btn-save{background:#3d6fd6;}",
      ".kb-btn-cancel{background:#5b636f;}",
      ".kb-btn-close{background:transparent;color:#9aa4b2;padding:9px 10px;font-size:1.1rem;}",
      ".kb-hint{margin-top:10px;font-size:.8rem;color:#aeb6c2;text-align:center;line-height:1.5;}",
      ".kb-hint.hidden{display:none;}",

      /* הדגשת בלוק בזמן ריחוף במצב לחיצה — רק על האלמנט שמתחת לעכבר,
         הדגשה רכה בלי קו מקווקו */
      pickCursor + "{cursor:pointer;}",
      pickHover + "{background:rgba(120,160,255,.14);border-radius:8px;",
      "box-shadow:0 0 0 6px rgba(120,160,255,.10);}",

      /* מצב עריכה — סימון עדין של מה שניתן לעריכה (בלי קו מקווקו).
         כלל אחד גנרי מכסה כל אלמנט ב-EDIT_TARGETS, כולל כאלה שיתווספו בעתיד. */
      "[contenteditable=true]{outline:none;}",
      ".kb-editing [contenteditable=true]{background:rgba(47,158,106,.09);border-radius:6px;",
      "box-shadow:0 0 0 4px rgba(47,158,106,.09);}",
      /* גוף המאמר הוא בלוק גדול — מסגרת במקום רקע מלא */
      ".kb-editing " + EDITABLE_SELECTOR + "[contenteditable=true]{background:none;",
      "box-shadow:0 0 0 2px rgba(47,158,106,.45);border-radius:10px;padding:6px 10px;}",
      /* גוף ההערה נשאר צהוב — בלי גוון ירוק מעליו */
      ".kb-editing .kb-note-body[contenteditable=true]{background:none;box-shadow:none;}",
      ".kb-editing [contenteditable=true]:focus{box-shadow:0 0 0 2px rgba(47,158,106,.6);border-radius:6px;}",

      /* טוסט */
      ".kb-toast{position:fixed;bottom:80px;left:20px;z-index:10000;background:#1e2430;color:#fff;",
      "padding:10px 16px;border-radius:10px;font-family:'Assistant',system-ui,sans-serif;",
      "font-size:.88rem;box-shadow:0 6px 24px rgba(0,0,0,.3);opacity:0;transform:translateY(8px);",
      "transition:opacity .2s ease,transform .2s ease;direction:rtl;}",
      ".kb-toast.show{opacity:1;transform:translateY(0);}"
    ].join("");
    var style = document.createElement("style");
    style.id = "kb-review-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------- כלי עזר ---------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  var toastTimer = null;
  function toast(msg) {
    var t = document.querySelector(".kb-toast");
    if (!t) {
      t = el("div", "kb-toast kb-review-ui");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    // reflow כדי שהאנימציה תרוץ מחדש
    void t.offsetWidth;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ---------- בניית הסרגל ---------- */
  var toolbar, hint, btnEdit, btnComment, btnRedundant, launcher;

  function build() {
    injectStyle();

    launcher = el("button", "kb-launcher kb-review-ui", "✏️");
    launcher.type = "button";
    launcher.title = "פתח מצב סקירה";
    launcher.addEventListener("click", openToolbar);
    document.body.appendChild(launcher);

    toolbar = el("div", "kb-toolbar kb-review-ui hidden");

    var row = el("div", "kb-toolbar-row");

    btnEdit = el("button", "kb-btn kb-btn-edit", "✏️ עריכה חיה");
    btnEdit.type = "button";
    btnEdit.addEventListener("click", function () { setMode(state.mode === "edit" ? null : "edit"); });

    btnComment = el("button", "kb-btn kb-btn-comment", "💬 הוסף הערה");
    btnComment.type = "button";
    btnComment.addEventListener("click", function () { setMode(state.mode === "comment" ? null : "comment"); });

    btnRedundant = el("button", "kb-btn kb-btn-redundant", "🖍 סמן מיותר");
    btnRedundant.type = "button";
    btnRedundant.addEventListener("click", function () { setMode(state.mode === "redundant" ? null : "redundant"); });

    var btnSave = el("button", "kb-btn kb-btn-save", "💾 שמור קובץ");
    btnSave.type = "button";
    btnSave.addEventListener("click", save);

    var btnCancel = el("button", "kb-btn kb-btn-cancel", "↩︎ בטל שינויים");
    btnCancel.type = "button";
    btnCancel.title = "שחזור הדף למצב השמור האחרון, בלי לשמור את השינויים";
    btnCancel.addEventListener("click", cancelChanges);

    var btnClose = el("button", "kb-btn kb-btn-close", "✕");
    btnClose.type = "button";
    btnClose.title = "סגור סרגל";
    btnClose.addEventListener("click", closeToolbar);

    row.appendChild(btnEdit);
    row.appendChild(btnComment);
    row.appendChild(btnRedundant);
    row.appendChild(btnSave);
    row.appendChild(btnCancel);
    row.appendChild(btnClose);
    toolbar.appendChild(row);

    hint = el("div", "kb-hint hidden");
    toolbar.appendChild(hint);

    document.body.appendChild(toolbar);

    // מפעילים מחדש הערות קיימות שנשמרו בקובץ
    hydrateExistingNotes();
  }

  function openToolbar() {
    toolbar.classList.remove("hidden");
    launcher.classList.add("hidden");
  }
  function closeToolbar() {
    setMode(null);
    toolbar.classList.add("hidden");
    launcher.classList.remove("hidden");
  }

  /* ---------- מעקב אחרי שינויים לא-שמורים + ביטול ---------- */
  function markDirty() {
    state.dirty = true;
  }
  // הקלדה בכל אלמנט שניתן לעריכה (טקסט או גוף הערה) מסמנת "יש שינויים".
  document.addEventListener("input", function (e) {
    if (e.target && e.target.closest && e.target.closest('[contenteditable="true"]')) {
      markDirty();
    }
  });

  function cancelChanges() {
    if (!state.dirty) {
      toast("אין שינויים לבטל");
      return;
    }
    var ok = window.confirm(
      "לבטל את כל השינויים שלא נשמרו? הדף ישוחזר למצב השמור האחרון."
    );
    if (!ok) return;
    // כל השינויים חיים רק ב-DOM עד לשמירה, לכן טעינה מחדש משחזרת את
    // הדף בדיוק לגרסה שעל הדיסק.
    state.dirty = false;
    location.reload();
  }

  /* ---------- ניהול מצבים ---------- */
  function setMode(mode) {
    // כיבוי המצב הקודם
    exitEdit();
    document.body.classList.remove("kb-picking");
    btnEdit.classList.remove("on");
    btnComment.classList.remove("on");
    btnRedundant.classList.remove("on");
    hint.classList.add("hidden");

    if (state.mode === mode) mode = null; // בטיחות
    state.mode = mode;

    if (mode === "edit") {
      btnEdit.classList.add("on");
      btnEdit.innerHTML = "✅ עריכה פעילה";
      enterEdit();
      hint.textContent = "ערוך את הטקסט ישירות. לחץ שוב על הכפתור כדי לסיים.";
      hint.classList.remove("hidden");
    } else {
      btnEdit.innerHTML = "✏️ עריכה חיה";
    }

    if (mode === "comment") {
      btnComment.classList.add("on");
      document.body.classList.add("kb-picking");
      hint.textContent = "לחץ על כל פסקה או כותרת כדי להוסיף לה הערה. לחץ שוב על הכפתור כדי לסיים.";
      hint.classList.remove("hidden");
    }

    if (mode === "redundant") {
      btnRedundant.classList.add("on");
      document.body.classList.add("kb-picking");
      hint.textContent = "לחץ על כל פסקה או כותרת כדי לסמן/לבטל אותה כמיותרת. לחץ שוב על הכפתור כדי לסיים.";
      hint.classList.remove("hidden");
    }
  }

  function enterEdit() {
    document.body.classList.add("kb-editing");
    document.querySelectorAll(EDIT_TARGETS).forEach(function (n) {
      n.setAttribute("contenteditable", "true");
    });
  }
  function exitEdit() {
    document.body.classList.remove("kb-editing");
    // מסירים contenteditable רק מהאלמנטים שאנחנו הפכנו לניתנים לעריכה,
    // כדי לא לפגוע בגוף ההערות (kb-note-body) שנשאר ניתן לעריכה תמיד.
    document.querySelectorAll(EDIT_TARGETS).forEach(function (n) {
      n.removeAttribute("contenteditable");
    });
  }

  /* ---------- לחיצה על בלוק (הערה / מיותר) ---------- */
  document.addEventListener(
    "click",
    function (e) {
      // במצב עריכה: מונעים ניווט בלחיצה על כרטיס (שהוא קישור), כדי לאפשר
      // לערוך את הכותרת/התקציר שבתוכו בלי לקפוץ לעמוד.
      if (state.mode === "edit" && e.target.closest(".card")) {
        e.preventDefault();
        return;
      }

      if (state.mode !== "comment" && state.mode !== "redundant") return;
      // מתעלמים מלחיצות בתוך הממשק עצמו או בתוך פתק קיים
      if (e.target.closest(".kb-review-ui") || e.target.closest(".kb-note")) return;

      var zone = e.target.closest(PICK_ZONE_SELECTOR);
      if (!zone) return;
      // בכרטיס — היחידה היא הכרטיס כולו; אחרת — הבלוק (פסקה/כותרת) הקרוב.
      var block = zone.classList.contains("card") ? zone : e.target.closest(BLOCK_SELECTOR);
      if (!block || !zone.contains(block)) return;

      e.preventDefault();
      e.stopPropagation();

      if (state.mode === "comment") addNote(block);
      else toggleRedundant(block);
    },
    true
  );

  /* ---------- הערות ---------- */
  function renumberNotes() {
    var notes = document.querySelectorAll(".kb-note");
    notes.forEach(function (note, i) {
      var num = note.querySelector(".kb-note-label");
      if (num) num.textContent = "הערה " + (i + 1);
    });
  }

  function makeNoteEl(text) {
    var note = el("aside", "kb-note");
    note.setAttribute("data-kb-note", "");

    var head = el("div", "kb-note-num");
    var label = el("span", "kb-note-label", "הערה");
    var del = el("button", "kb-note-del kb-review-ui", "✕");
    del.type = "button";
    del.title = "מחק הערה";
    del.addEventListener("click", function () {
      note.remove();
      renumberNotes();
      markDirty();
    });
    head.appendChild(label);
    head.appendChild(del);

    var body = el("div", "kb-note-body");
    body.setAttribute("contenteditable", "true");
    if (text) body.textContent = text;

    note.appendChild(head);
    note.appendChild(body);
    return note;
  }

  function addNote(block) {
    var note = makeNoteEl("");
    block.insertAdjacentElement("afterend", note);
    renumberNotes();
    markDirty();
    var body = note.querySelector(".kb-note-body");
    body.focus();
  }

  // הופך הערות שכבר שמורות בקובץ לניתנות לעריכה/מחיקה מחדש בפתיחת הדף
  function hydrateExistingNotes() {
    document.querySelectorAll(".kb-note").forEach(function (note) {
      if (note.querySelector(".kb-note-del")) return; // כבר עשירה
      var head = note.querySelector(".kb-note-num");
      var body = note.querySelector(".kb-note-body");
      if (!head || !body) return;
      if (!head.querySelector(".kb-note-label")) {
        var label = el("span", "kb-note-label", head.textContent || "הערה");
        head.textContent = "";
        head.appendChild(label);
      }
      var del = el("button", "kb-note-del kb-review-ui", "✕");
      del.type = "button";
      del.title = "מחק הערה";
      del.addEventListener("click", function () { note.remove(); renumberNotes(); markDirty(); });
      head.appendChild(del);
      body.setAttribute("contenteditable", "true");
    });
    renumberNotes();
  }

  /* ---------- סימון מיותר ---------- */
  function toggleRedundant(block) {
    block.classList.toggle("kb-redundant");
    markDirty();
  }

  /* ---------- שמירה ---------- */
  // הנתיב היחסי של הדף לשורש האתר, למשל "personal-development/values.html".
  function currentRelPath() {
    var page = document.body.getAttribute("data-page");
    if (page) return page.replace(/^\/+/, "");
    // גיבוי: מנתיב ה-URL, לפי עומק הדף
    var depth = parseInt(document.body.getAttribute("data-depth") || "0", 10);
    var segs = location.pathname.split("/").filter(Boolean);
    return segs.slice(segs.length - (depth + 1)).join("/") || "index.html";
  }
  function currentFileName() {
    var parts = currentRelPath().split("/");
    return parts[parts.length - 1] || "index.html";
  }

  /* ---------- אחסון handle לתיקייה ב-IndexedDB ---------- */
  // File System Access handles ניתנים לשמירה ב-IndexedDB, כך שהאישור נשמר
  // בין דפים ובין רענונים. לאחר בחירת התיקייה פעם אחת, השמירה שקטה לגמרי.
  function idb(fn) {
    return new Promise(function (resolve, reject) {
      var open = indexedDB.open("kb-review", 1);
      open.onupgradeneeded = function () { open.result.createObjectStore("handles"); };
      open.onerror = function () { reject(open.error); };
      open.onsuccess = function () {
        var db = open.result;
        var tx = db.transaction("handles", "readwrite");
        var store = tx.objectStore("handles");
        var req = fn(store);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
        tx.oncomplete = function () { db.close(); };
      };
    });
  }
  function idbGet(key) { return idb(function (s) { return s.get(key); }); }
  function idbSet(key, val) { return idb(function (s) { return s.put(val, key); }); }

  async function ensurePermission(handle) {
    var opts = { mode: "readwrite" };
    if ((await handle.queryPermission(opts)) === "granted") return true;
    if ((await handle.requestPermission(opts)) === "granted") return true;
    return false;
  }

  // מחזיר handle לתיקיית השורש עם הרשאת כתיבה, או null אם אין תמיכה/סירוב.
  async function getRootDir(promptIfMissing) {
    if (rootDir && (await ensurePermission(rootDir))) return rootDir;
    try {
      var stored = await idbGet("root-dir");
      if (stored && (await ensurePermission(stored))) { rootDir = stored; return rootDir; }
    } catch (e) { /* IndexedDB לא זמין */ }
    if (!promptIfMissing || !window.showDirectoryPicker) return null;
    var picked = await window.showDirectoryPicker({ id: "kb-root", mode: "readwrite" });
    if (!(await ensurePermission(picked))) return null;
    rootDir = picked;
    try { await idbSet("root-dir", picked); } catch (e) { /* לא נורא — נבקש שוב בפעם הבאה */ }
    return rootDir;
  }

  async function writeToDir(dir, relPath, contents) {
    var parts = relPath.split("/").filter(Boolean);
    var fileName = parts.pop();
    var d = dir;
    for (var i = 0; i < parts.length; i++) {
      d = await d.getDirectoryHandle(parts[i]);
    }
    var fh = await d.getFileHandle(fileName);
    var writable = await fh.createWritable();
    await writable.write(contents);
    await writable.close();
  }

  function buildCleanHTML() {
    var clone = document.documentElement.cloneNode(true);

    // הסרת כל אלמנטי הממשק
    clone.querySelectorAll(".kb-review-ui").forEach(function (n) { n.remove(); });
    var styleTag = clone.querySelector("#kb-review-style");
    if (styleTag) styleTag.remove();

    // הסרת כל מה ש-nav.js מזריק בזמן ריצה, כדי שהקובץ הנשמר יחזור לצורת
    // המקור. בלי זה כל שמירה מקבעת את סרגל הצד/פירורי הלחם לתוך הקובץ,
    // ו-nav.js היה מזריק אותם שוב בטעינה הבאה — כפילויות מצטברות.
    clone.querySelectorAll("[data-kb-gen]").forEach(function (n) { n.remove(); });
    clone.querySelectorAll("[data-kb-container]").forEach(function (n) {
      n.innerHTML = "";
      n.removeAttribute("data-kb-container");
    });

    // מצב זמני שנקבע בזמן ריצה ואינו חלק מהמקור
    clone.removeAttribute("data-theme"); // נקבע לפי ההעדפה השמורה
    clone.querySelectorAll(".mobile-open").forEach(function (n) {
      n.classList.remove("mobile-open");
    });
    clone.querySelectorAll(".sidebar-overlay.show").forEach(function (n) {
      n.classList.remove("show");
    });

    // הסרת מצב עריכה
    clone.querySelectorAll("[contenteditable]").forEach(function (n) {
      n.removeAttribute("contenteditable");
    });
    // ניקוי מחלקות עזר זמניות מה-body, ליתר ביטחון
    if (clone.querySelector("body")) {
      clone.querySelector("body").classList.remove("kb-editing", "kb-picking");
    }

    // ניקוי כותרת הפתק — שומרים רק את הטקסט "הערה N"
    clone.querySelectorAll(".kb-note .kb-note-num").forEach(function (head) {
      var label = head.querySelector(".kb-note-label");
      head.textContent = label ? label.textContent : "הערה";
    });

    var html = "<!DOCTYPE html>\n" + clone.outerHTML + "\n";
    return html;
  }

  async function save() {
    // סוגרים מצב עריכה כדי שהטקסט יתקבע ב-DOM לפני השכפול
    if (state.mode) setMode(null);

    var html = buildCleanHTML();
    var relPath = currentRelPath();

    // מסלול 1 (מועדף): שרת הפיתוח המקומי (tools/dev-server.js) — כתיבה
    // שקטה לגמרי לקובץ בלחיצה אחת, בלי שום דיאלוג או הרשאה. זהו המסלול
    // שפועל בתוך התצוגה המקדימה של קלוד. אם אין שרת כזה, נופלים למסלול הבא.
    if (location.protocol === "http:" || location.protocol === "https:") {
      try {
        var res = await fetch("/__save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: relPath, html: html })
        });
        if (res.ok) {
          state.dirty = false;
          toast("נשמר ✓ " + relPath);
          return;
        }
        // 404/405 => אין נקודת שמירה (למשל npx serve). ננסה מסלול אחר.
        if (res.status !== 404 && res.status !== 405) {
          var info = await res.json().catch(function () { return {}; });
          toast("שמירה נכשלה: " + (info.error || res.status));
          return;
        }
      } catch (e) {
        /* אין שרת שמירה זמין — ממשיכים למסלול הבא */
      }
    }

    // מסלול 2: כתיבה שקטה לקובץ דרך handle של תיקיית השורש (File System Access).
    if (window.showDirectoryPicker) {
      try {
        var firstTime = !rootDir;
        var dir = await getRootDir(true);
        if (dir) {
          if (firstTime) toast("מחבר את תיקיית האתר…");
          await writeToDir(dir, relPath, html);
          state.dirty = false;
          toast("נשמר ✓ " + relPath);
          return;
        }
      } catch (err) {
        if (err && err.name === "AbortError") return; // המשתמש ביטל את בחירת התיקייה
        if (err && err.name === "NotFoundError") {
          toast("הקובץ לא נמצא בתיקייה שנבחרה. בחר את תיקיית שורש האתר.");
          rootDir = null;
          try { await idbSet("root-dir", undefined); } catch (e) {}
          return;
        }
        console.warn("שמירה ישירה נכשלה, עוברים להורדה:", err);
      }
    }

    // גיבוי: הורדת הקובץ (דפדפנים ללא File System Access API, כמו Firefox/Safari)
    var blob = new Blob([html], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = el("a");
    a.href = url;
    a.download = currentFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    state.dirty = false;
    toast("הקובץ ירד — החלף בו את הקובץ המקורי");
  }

  /* ---------- אתחול ---------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
