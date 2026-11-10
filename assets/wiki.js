/*
  Builds the shared parts of every page: header, sidebar, search,
  and the category lists on the Main Page.
  Each page sets <body data-root="">  (Main Page) or data-root="../" (pages/ folder)
  so links work from anywhere, offline or online.
*/
(function () {
  const root = document.body.dataset.root || "";
  const here = location.pathname.split("/").slice(-2).join("/");

  const isCurrent = (p) =>
    here.endsWith(p) || (p === "index.html" && /\/$|index\.html$/.test(location.pathname) && root === "");

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Header ---------- */
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <button class="menu-btn" aria-label="Open menu" aria-expanded="false">☰</button>
    <a class="brand" href="${root}index.html">
      <span class="brand-mark" aria-hidden="true"></span>
      <span class="brand-text">PROJECT CAELUM <small>WIKI</small></span>
    </a>
    <div class="search">
      <input type="search" placeholder="Search…" aria-label="Search the wiki" autocomplete="off">
      <ul class="search-results" role="listbox" hidden></ul>
    </div>`;
  document.body.prepend(header);

  /* ---------- Sidebar ---------- */
  const nav = document.createElement("nav");
  nav.className = "sidebar";
  let navHtml = `
    <div class="nav-group">
      <h4>Navigation</h4>
      <ul>
        <li><a href="${root}index.html" ${isCurrent("index.html") ? 'class="current"' : ""}>Main Page</a></li>
        <li><a href="#" class="random-link">Random page</a></li>
      </ul>
    </div>`;
  for (const cat of CATEGORIES) {
    const pages = PAGES.filter((p) => p.category === cat);
    if (!pages.length) continue;
    navHtml += `<div class="nav-group"><h4>${esc(cat)}</h4><ul>`;
    for (const p of pages) {
      navHtml += `<li><a href="${root}${p.path}" ${isCurrent(p.path) ? 'class="current"' : ""}>${esc(p.title)}</a></li>`;
    }
    navHtml += `</ul></div>`;
  }
  nav.innerHTML = navHtml;

  const layout = document.querySelector(".layout");
  if (layout) layout.prepend(nav);

  /* Mobile menu toggle */
  const menuBtn = header.querySelector(".menu-btn");
  menuBtn.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    menuBtn.setAttribute("aria-expanded", open);
  });

  /* Random page */
  nav.querySelector(".random-link").addEventListener("click", (e) => {
    e.preventDefault();
    if (!PAGES.length) return;
    const p = PAGES[Math.floor(Math.random() * PAGES.length)];
    location.href = root + p.path;
  });

  /* ---------- Search ---------- */
  const input = header.querySelector(".search input");
  const results = header.querySelector(".search-results");

  function runSearch() {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.hidden = true; results.innerHTML = ""; return; }
    const hits = PAGES
      .map((p) => {
        const t = p.title.toLowerCase();
        let score = 0;
        if (t.startsWith(q)) score = 3;
        else if (t.includes(q)) score = 2;
        else if ((p.summary + " " + p.category).toLowerCase().includes(q)) score = 1;
        return { p, score };
      })
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    results.innerHTML = hits.length
      ? hits.map(({ p }) => `<li><a href="${root}${p.path}"><strong>${esc(p.title)}</strong><span>${esc(p.category)} · ${esc(p.summary)}</span></a></li>`).join("")
      : `<li class="no-results">No pages match “${esc(input.value)}”</li>`;
    results.hidden = false;
  }

  input.addEventListener("input", runSearch);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const first = results.querySelector("a");
      if (first) location.href = first.getAttribute("href");
    } else if (e.key === "Escape") {
      results.hidden = true;
      input.blur();
    }
  });
  document.addEventListener("click", (e) => {
    if (!header.querySelector(".search").contains(e.target)) results.hidden = true;
  });

  /* ---------- Main Page category lists ---------- */
  const hub = document.getElementById("category-hub");
  if (hub) {
    hub.innerHTML = CATEGORIES.map((cat) => {
      const pages = PAGES.filter((p) => p.category === cat);
      const list = pages.length
        ? `<ul>${pages.map((p) => `<li><a href="${root}${p.path}">${esc(p.title)}</a><span>${esc(p.summary)}</span></li>`).join("")}</ul>`
        : `<p class="muted">No pages yet.</p>`;
      return `<section class="card"><h3>${esc(cat)}</h3>${list}</section>`;
    }).join("");
  }

  const count = document.getElementById("page-count");
  if (count) count.textContent = PAGES.length;
})();
