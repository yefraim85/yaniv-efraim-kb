/* ==========================================================================
   Yaniv Efraim — Personal Knowledge Base
   Site-wide nested navigation engine.

   Every page includes:
     <div id="site-header"></div>
     <script src="{prefix}assets/js/nav.js"></script>
   and sets on <body>:
     data-depth="N"   number of folders below the site root (root index = 0)
     data-page="..."  this page's root-relative path, matching a href below
     data-crumbs='[{"label":"Parenting","href":"parenting/index.html"},{"label":"On Parenting"}]'
       (optional — omit on the home page; last crumb has no href)

   To add a page to the site: add one entry below (with a "children" array
   for a nested dropdown, or without one for a flat top-level link), then
   create the file using templates/nav-page-template.html (hub) or
   templates/article-page-template.html (article).
   ========================================================================== */

const NAV_CONFIG = [
  { label: "Home", href: "index.html" },
  { label: "About Me", href: "about/index.html" },
  {
    label: "Personal Development",
    href: "personal-development/index.html",
    children: [
      { label: "Worldview & Philosophy", href: "personal-development/worldview-and-philosophy.html" },
      { label: "Book of Life", href: "personal-development/book-of-life.html" },
      { label: "Short Insights", href: "personal-development/short-insights.html" },
    ],
  },
  {
    label: "Parenting",
    href: "parenting/index.html",
    children: [
      { label: "On Parenting", href: "parenting/on-parenting.html" },
      { label: "Parenting Tips", href: "parenting/parenting-tips.html" },
      { label: "The Jewish Questions Book", href: "parenting/jewish-questions-book.html" },
    ],
  },
  {
    label: "Business & Systems",
    href: "business-systems/index.html",
    children: [
      { label: "SUMIT", href: "business-systems/sumit.html" },
      { label: "Accounting for Representatives", href: "business-systems/accounting-for-representatives.html" },
    ],
  },
  {
    label: "SOL — Retreat & Community",
    href: "sol-retreat/index.html",
    children: [
      { label: "School of Life (Thailand)", href: "sol-retreat/school-of-life.html" },
      { label: "Parent Yourself First", href: "sol-retreat/parent-yourself-first.html" },
      { label: "House of Hugs", href: "sol-retreat/house-of-hugs.html" },
    ],
  },
  { label: "Lectures & Workshops", href: "lectures-workshops/index.html" },
];

(function () {
  const body = document.body;
  const depth = parseInt(body.getAttribute("data-depth") || "0", 10);
  const currentPage = body.getAttribute("data-page") || "index.html";
  const prefix = "../".repeat(depth);

  function isActive(href) {
    return href === currentPage;
  }

  function isAncestorActive(item) {
    if (isActive(item.href)) return true;
    if (item.children) return item.children.some((c) => isActive(c.href));
    return false;
  }

  function renderNavItem(item) {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const activeTop = isAncestorActive(item);
    const li = document.createElement("li");
    li.className = "nav-item" + (activeTop ? " active" : "");

    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = prefix + item.href;
    link.innerHTML = item.label + (hasChildren ? ' <span class="caret">▾</span>' : "");
    li.appendChild(link);

    if (hasChildren) {
      const sub = document.createElement("ul");
      sub.className = "nav-dropdown";
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

      // Click/tap toggles the dropdown (covers mobile + keyboard use);
      // desktop also gets a CSS :hover fallback for quick mouse use.
      link.addEventListener("click", (e) => {
        const isMobile = window.matchMedia("(max-width: 760px)").matches;
        if (isMobile) {
          e.preventDefault();
          const wasOpen = li.classList.contains("open");
          document.querySelectorAll(".nav-item.open").forEach((el) => el.classList.remove("open"));
          if (!wasOpen) li.classList.add("open");
        }
      });
    }

    return li;
  }

  function renderHeader() {
    const host = document.getElementById("site-header");
    if (!host) return;

    const topbar = document.createElement("div");
    topbar.className = "site-topbar";

    const inner = document.createElement("div");
    inner.className = "site-topbar-inner";

    const brand = document.createElement("a");
    brand.className = "site-brand";
    brand.href = prefix + "index.html";
    brand.style.textDecoration = "none";
    brand.innerHTML = 'Yaniv Efraim <span>· Knowledge Base</span>';

    const toggle = document.createElement("button");
    toggle.className = "nav-toggle";
    toggle.setAttribute("aria-label", "Toggle navigation");
    toggle.innerHTML = "☰";

    const nav = document.createElement("nav");
    nav.className = "site-nav";
    const ul = document.createElement("ul");
    NAV_CONFIG.forEach((item) => ul.appendChild(renderNavItem(item)));
    nav.appendChild(ul);

    toggle.addEventListener("click", () => {
      nav.classList.toggle("mobile-open");
    });

    inner.appendChild(brand);
    inner.appendChild(toggle);
    inner.appendChild(nav);
    topbar.appendChild(inner);
    host.appendChild(topbar);

    // Breadcrumb (optional)
    const crumbsRaw = body.getAttribute("data-crumbs");
    if (crumbsRaw) {
      try {
        const crumbs = JSON.parse(crumbsRaw);
        const bc = document.createElement("div");
        bc.className = "breadcrumb";
        const bcWrap = document.createElement("div");
        bcWrap.className = "wrap";
        const parts = [`<a href="${prefix}index.html">Home</a>`];
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
        host.appendChild(bc);
      } catch (err) {
        console.warn("Invalid data-crumbs JSON on page", currentPage, err);
      }
    }

    // Close mobile menu / dropdowns when clicking outside
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove("mobile-open");
        document.querySelectorAll(".nav-item.open").forEach((el) => el.classList.remove("open"));
      }
    });
  }

  renderHeader();
})();
