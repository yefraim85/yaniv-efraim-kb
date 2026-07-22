/* ==========================================================================
   יניב אפרים — מאגר ידע אישי
   מנוע ניווט תפריט צד (Sidebar) לכל האתר.

   כל דף כולל:
     <div id="mobile-topbar"></div>
     <div id="sidebar-overlay" class="sidebar-overlay"></div>
     <div class="app-shell">
       <aside id="sidebar" class="sidebar"></aside>
       <div class="app-main"> ...תוכן הדף... </div>
     </div>
     <script src="{prefix}assets/js/nav.js"></script>

   ועל ה-<body> יש להגדיר:
     data-depth="N"   כמה תיקיות מתחת לשורש האתר נמצא הדף (השורש = 0)
     data-page="..."  הנתיב היחסי לשורש של הדף הזה, תואם ל-href למטה
     data-crumbs='[{"label":"הורות","href":"parenting/index.html"},{"label":"על הורות"}]'
       (אופציונלי — לא נדרש בדף הבית; לפריט האחרון אין href)

   כדי להוסיף דף חדש: הוסיפו רשומה למטה (עם מערך "children" לתת-תפריט,
   או בלעדיו לקישור עליון שטוח), ואז צרו את הקובץ לפי
   templates/nav-page-template.html (עמוד קטגוריה) או
   templates/article-page-template.html (כתבה).
   ========================================================================== */

const NAV_CONFIG = [
  { label: "בית", href: "index.html" },
  {
    label: "פיתוח אישי",
    href: "personal-development/index.html",
    children: [
      { label: "ערכים מובילים", href: "personal-development/values.html" },
      { label: "בעלות רדיקלית", href: "personal-development/radical-ownership.html" },
      { label: "בחירה ורצון", href: "personal-development/choice-and-will.html" },
    ],
  },
  {
    label: "זוגיות",
    href: "relationships/index.html",
    children: [
      { label: "מציאת זוגיות", href: "relationships/finding-a-relationship.html" },
      { label: "ביסוס זוגיות", href: "relationships/establishing-a-relationship.html" },
      { label: "פריחה בזוגיות", href: "relationships/flourishing-in-a-relationship.html" },
    ],
  },
  {
    label: "הורות",
    href: "parenting/index.html",
    children: [
      { label: "לא לגדל אנשים שאנחנו שונאים", href: "parenting/raising-people-we-like.html" },
      { label: "להקשיב ללחישות, לפני שהופכות לצעקות", href: "parenting/listening-to-whispers.html" },
      { label: "איזון רשויות: ההורה כמחוקק, שופט ואוכף", href: "parenting/three-branches-of-parenting.html" },
    ],
  },
  {
    label: "לעשות כסף",
    href: "making-money/index.html",
    children: [
      { label: "גאונות", href: "making-money/genius.html" },
      { label: "בניית סולם להצלחה", href: "making-money/ladder-to-success.html" },
      { label: "מחזון למשימות", href: "making-money/vision-to-tasks.html" },
      { label: "איטרציה של בדיקה עצמית", href: "making-money/self-review-iteration.html" },
    ],
  },
  {
    label: "מקצועיות בעבודה",
    href: "professionalism/index.html",
    children: [
      { label: "תעדוף", href: "professionalism/prioritization.html" },
      { label: "ניהול מייל ב-Zero Inbox", href: "professionalism/zero-inbox-email.html" },
      { label: "התנהלות עם יומן", href: "professionalism/calendar-management.html" },
    ],
  },
  {
    label: "פוליטיקה",
    href: "politics/index.html",
    children: [
      { label: "עימות בין השקפות", href: "politics/conflict-of-visions.html" },
      { label: "ימין רומנטי", href: "politics/romantic-right.html" },
      { label: "עקרונות ימין לפי משרד ולפי נושא", href: "politics/principles-by-ministry.html" },
      { label: "על אמת", href: "politics/on-truth.html" },
      { label: "האם אתה היית שורד?", href: "politics/would-you-survive.html" },
      { label: "סיאוב", href: "politics/institutional-decay.html" },
    ],
  },
  {
    label: "תקשורת",
    href: "communication/index.html",
    children: [
      { label: "עבודה משותפת בעידן הדיגיטלי", href: "communication/collaborative-work-digital-age.html" },
      { label: "התכתבות עם מטרה", href: "communication/message-purpose.html" },
      { label: "תקשורת לא אלימה", href: "communication/nonviolent-communication.html" },
      { label: "טוהר המילה", href: "communication/purity-of-the-word.html" },
    ],
  },
  {
    label: "סגנון כתיבה",
    href: "writing-style/index.html",
    children: [
      { label: "עקרונות הכתיבה שלי", href: "writing-style/principles.html" },
      { label: "המבנה שחוזר בכל כתבה", href: "writing-style/structure.html" },
    ],
  },
  {
    label: "כספים",
    href: "finance/index.html",
    children: [
      { label: "ניהול תקציב", href: "finance/budget-management.html" },
      { label: "ניהול תזרים", href: "finance/cash-flow-management.html" },
      { label: "תכנון מול ביצוע", href: "finance/planning-vs-execution.html" },
      { label: "תקציב משפחתי וחיסכון ליום גשום", href: "finance/family-budget-and-emergency-fund.html" },
      { label: "השקעת כספים", href: "finance/investing-money.html" },
    ],
  },
  {
    label: "הנהלת חשבונות",
    href: "accounting/index.html",
    children: [
      { label: "למה בכלל עושים הנהלת חשבונות", href: "accounting/why-bookkeeping-matters.html" },
      { label: "מילון מונחים", href: "accounting/glossary.html" },
      { label: "תנועות יומן", href: "accounting/journal-entries.html" },
    ],
  },
  {
    label: "סמים",
    href: "drugs/index.html",
    children: [
      { label: "אנחנו נגד סמים", href: "drugs/against-drugs.html" },
      { label: "הערות מקדימות לשימוש במשני תודעה", href: "drugs/preliminary-notes-consciousness-altering.html" },
    ],
  },
];

// קישורים קטנים שצמודים לתחתית סרגל הצד, מתחת לניווט הראשי.
const SIDEBAR_BOTTOM_LINKS = [
  { label: "על מאגר הידע", href: "about-kb/index.html" },
  { label: "על יניב", href: "about-yaniv/index.html" },
  { label: "בקרוב", href: "tasks/index.html" },
];

// קישורים משפטיים שמופיעים בפוטר של כל דף.
const FOOTER_LEGAL_LINKS = [
  { label: "הצהרת נגישות", href: "legal/accessibility.html" },
  { label: "הצהרת פרטיות", href: "legal/privacy.html" },
  { label: "תנאי שימוש", href: "legal/terms.html" },
  { label: "מדיניות עוגיות", href: "legal/cookies.html" },
];

(function () {
  const body = document.body;
  const depth = parseInt(body.getAttribute("data-depth") || "0", 10);
  const currentPage = body.getAttribute("data-page") || "index.html";
  const prefix = "../".repeat(depth);

  function isActive(href) {
    return href === currentPage;
  }
  function categoryIsActive(item) {
    if (isActive(item.href)) return true;
    if (item.children) return item.children.some((c) => isActive(c.href));
    return false;
  }

  function renderNavItem(item) {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const active = categoryIsActive(item);

    const li = document.createElement("li");
    li.className = "nav-item" + (active ? " active" : "") + (active && hasChildren ? " open" : "");

    const row = document.createElement("div");
    row.className = "nav-row";

    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = prefix + item.href;
    link.textContent = item.label;
    row.appendChild(link);

    if (hasChildren) {
      const caret = document.createElement("button");
      caret.type = "button";
      caret.className = "caret-btn";
      caret.setAttribute("aria-label", "הרחב/כווץ תת-תפריט");
      caret.innerHTML = "▾";
      caret.addEventListener("click", () => li.classList.toggle("open"));
      row.appendChild(caret);
    }

    li.appendChild(row);

    if (hasChildren) {
      const sub = document.createElement("ul");
      sub.className = "nav-children";
      item.children.forEach((child) => {
        const cLi = document.createElement("li");
        const cA = document.createElement("a");
        cA.href = prefix + child.href;
        cA.textContent = child.label;
        if (isActive(child.href)) cA.classList.add("active");
        cLi.appendChild(cA);
        sub.appendChild(cLi);
      });
      li.appendChild(sub);
    }

    return li;
  }

  function renderFavicon() {
    // מזריקים את הפאביקון כאן כדי שיהיה זהה בכל הדפים, עם נתיב יחסי נכון
    // לפי עומק הדף (prefix). לא נדרס אם כבר הוגדר פאביקון ידנית בדף.
    if (document.querySelector('link[rel="icon"]')) return;
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = prefix + "assets/favicon.svg";
    document.head.appendChild(link);
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("kb-theme", theme);
    } catch (err) {
      /* localStorage לא זמין — פשוט לא נשמור העדפה */
    }
  }

  function renderThemeToggle(sidebar) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";

    function updateLabel() {
      const isDark = currentTheme() === "dark";
      btn.innerHTML = isDark ? "☀️ <span>מצב בהיר</span>" : "🌙 <span>מצב כהה</span>";
      btn.setAttribute("aria-pressed", String(!isDark));
    }
    updateLabel();

    btn.addEventListener("click", () => {
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
      updateLabel();
    });

    sidebar.appendChild(btn);
  }

  function renderSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    const brand = document.createElement("a");
    brand.className = "sidebar-brand";
    brand.href = prefix + "index.html";
    brand.innerHTML = 'יניב אפרים <small>מאגר ידע אישי</small>';
    sidebar.appendChild(brand);

    renderThemeToggle(sidebar);

    sidebar.appendChild(document.createElement("hr")).className = "sidebar-divider";

    const nav = document.createElement("nav");
    nav.className = "sidebar-nav";
    const ul = document.createElement("ul");
    NAV_CONFIG.forEach((item) => ul.appendChild(renderNavItem(item)));
    nav.appendChild(ul);
    sidebar.appendChild(nav);

    const bottom = document.createElement("div");
    bottom.className = "sidebar-bottom";
    const bottomUl = document.createElement("ul");
    bottomUl.className = "sidebar-bottom-links";
    SIDEBAR_BOTTOM_LINKS.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = prefix + item.href;
      a.textContent = item.label;
      if (isActive(item.href)) a.classList.add("active");
      li.appendChild(a);
      bottomUl.appendChild(li);
    });
    bottom.appendChild(bottomUl);
    sidebar.appendChild(bottom);

    // Breadcrumb lives above the main content, not in the sidebar itself.
    const crumbsRaw = body.getAttribute("data-crumbs");
    const mainHost = document.querySelector(".app-main");
    if (crumbsRaw && mainHost) {
      try {
        const crumbs = JSON.parse(crumbsRaw);
        const bc = document.createElement("div");
        bc.className = "breadcrumb";
        const bcWrap = document.createElement("div");
        bcWrap.className = "wrap";
        const parts = [`<a href="${prefix}index.html">בית</a>`];
        crumbs.forEach((c) => {
          parts.push('<span class="sep">/</span>');
          if (c.href) {
            parts.push(`<a href="${prefix + c.href}">${c.label}</a>`);
          } else {
            parts.push(`<span class="current">${c.label}</span>`);
          }
        });
        bcWrap.innerHTML = parts.join("");
        bc.appendChild(bcWrap);
        mainHost.insertBefore(bc, mainHost.firstChild);
      } catch (err) {
        console.warn("data-crumbs לא תקין בדף", currentPage, err);
      }
    }
  }

  function renderMobileChrome() {
    const topbarHost = document.getElementById("mobile-topbar");
    const overlay = document.getElementById("sidebar-overlay");
    const sidebar = document.getElementById("sidebar");
    if (!topbarHost || !sidebar) return;

    const brand = document.createElement("a");
    brand.className = "mobile-brand";
    brand.href = prefix + "index.html";
    brand.textContent = "יניב אפרים";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "menu-toggle";
    toggle.setAttribute("aria-label", "פתח/סגור תפריט");
    toggle.innerHTML = "☰";

    topbarHost.appendChild(toggle);
    topbarHost.appendChild(brand);

    function closeDrawer() {
      sidebar.classList.remove("mobile-open");
      if (overlay) overlay.classList.remove("show");
    }
    function openDrawer() {
      sidebar.classList.add("mobile-open");
      if (overlay) overlay.classList.add("show");
    }

    toggle.addEventListener("click", () => {
      const isOpen = sidebar.classList.contains("mobile-open");
      if (isOpen) closeDrawer();
      else openDrawer();
    });
    if (overlay) overlay.addEventListener("click", closeDrawer);
  }

  function renderFooterLegal() {
    const footer = document.querySelector(".site-footer");
    if (!footer) return;

    const legalWrap = document.createElement("div");
    legalWrap.className = "wrap site-footer-legal";

    const ul = document.createElement("ul");
    FOOTER_LEGAL_LINKS.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = prefix + item.href;
      a.textContent = item.label;
      li.appendChild(a);
      ul.appendChild(li);
    });
    legalWrap.appendChild(ul);
    footer.appendChild(legalWrap);
  }

  function renderSitemap() {
    const root = document.getElementById("sitemap-root");
    if (!root) return;

    function addSection(title, items) {
      const section = document.createElement("div");
      section.className = "sitemap-section";

      const h3 = document.createElement("h3");
      h3.textContent = title;
      section.appendChild(h3);

      const ul = document.createElement("ul");
      ul.className = "sitemap-list";
      items.forEach((item) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = prefix + item.href;
        a.textContent = item.label;
        li.appendChild(a);

        if (item.children && item.children.length) {
          const subUl = document.createElement("ul");
          item.children.forEach((child) => {
            const subLi = document.createElement("li");
            const subA = document.createElement("a");
            subA.href = prefix + child.href;
            subA.textContent = child.label;
            subLi.appendChild(subA);
            subUl.appendChild(subLi);
          });
          li.appendChild(subUl);
        }

        ul.appendChild(li);
      });
      section.appendChild(ul);
      root.appendChild(section);
    }

    addSection("ניווט ראשי", NAV_CONFIG);
    addSection("עמודים נוספים", SIDEBAR_BOTTOM_LINKS);
    addSection("מידע משפטי", FOOTER_LEGAL_LINKS);
  }

  renderFavicon();
  renderSidebar();
  renderMobileChrome();
  renderFooterLegal();
  renderSitemap();
})();
