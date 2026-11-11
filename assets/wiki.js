/*
  AEROSPACE COMMAND RECORDS ARCHIVE — page builder
  ------------------------------------------------
  Each page only contains its <main> content. This script wraps it with:
    - classification banners (top and bottom)
    - the header, navigation and search for the page's era
  Page settings live on <body>:
    data-root   ""  for index.html,  "../"  for files in pages/
    data-era    "terminal" | "web90" | "portal" | "modern"
    data-class  "U" | "CUI" | "C" | "S" | "TS" | "SCI"
    data-marking  (optional) full banner text, e.g. "SECRET//NOFORN"
*/
(function () {
  const body = document.body;
  const root = body.dataset.root || "";
  const era = body.dataset.era || "modern";
  const level = (body.dataset.class || "U").toUpperCase();

  /* ---------- Settings you may want to change ---------- */
  const AGENCY = "United States Aerospace Command";
  const AGENCY_SHORT = "AEROCOM";

  const LEVELS = {
    U:   { text: "UNCLASSIFIED",     css: "u",   short: "U" },
    CUI: { text: "CUI",              css: "cui", short: "CUI" },
    C:   { text: "CONFIDENTIAL",     css: "c",   short: "C" },
    S:   { text: "SECRET",           css: "s",   short: "S" },
    TS:  { text: "TOP SECRET",       css: "ts",  short: "TS" },
    SCI: { text: "TOP SECRET//SCI",  css: "sci", short: "TS//SCI" },
  };

  const ERAS = {
    terminal: "ADN Mainframe (1970s)",
    web90:    "AEROCOM Web (1990s)",
    portal:   "AEROCOM Portal (2000s)",
    modern:   "Current System",
  };

  /* ---------- Helpers ---------- */
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lv = (code) => LEVELS[(code || "U").toUpperCase()] || LEVELS.U;
  const here = decodeURIComponent(location.pathname);
  const isCurrent = (p) => here.endsWith("/" + p) || (p === "index.html" && root === "");
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  body.classList.add("era-" + era);

  /* ---------- Classification banners ---------- */
  const L = lv(level);
  const marking = body.dataset.marking || L.text;
  const bannerTop = el("div", `cls-banner cls-${L.css}`, esc(marking));
  const bannerBottom = el("div", `cls-banner cls-${L.css} cls-bottom`, esc(marking));

  /* ---------- Navigation data ---------- */
  const groups = CATEGORIES
    .map((cat) => ({ cat, pages: PAGES.filter((p) => p.category === cat) }))
    .filter((g) => g.pages.length);

  const link = (p, label) =>
    `<a href="${root}${p.path}"${isCurrent(p.path) ? ' class="current"' : ""}>${esc(label ?? p.title)}</a>`;
  const homeLink = (label) =>
    `<a href="${root}index.html"${isCurrent("index.html") ? ' class="current"' : ""}>${label}</a>`;
  const randomLink = (label) => `<a href="#" data-random>${label}</a>`;

  /* ---------- Search box (shared logic, era-specific look) ---------- */
  function searchBox(placeholder, button) {
    return `
      <div class="search">
        ${era === "terminal" ? '<label for="q">QUERY&gt;</label>' : ""}
        <input id="q" type="search" placeholder="${placeholder}" aria-label="Search the archive" autocomplete="off">
        ${button ? `<button type="button" class="search-go">${button}</button>` : ""}
        <ul class="search-results" hidden></ul>
      </div>`;
  }

  /* ---------- Era layouts ---------- */
  const main = document.querySelector("main");
  const layout = el("div", "layout");
  const header = el("header", "site-header");
  const nav = el("nav", "sidebar");
  const footer = el("footer", "site-footer");

  if (era === "terminal") {
    header.innerHTML = `
      <pre class="term-head">${AGENCY_SHORT} DATA NETWORK (ADN)      TERMINAL 04
RECORDS RETRIEVAL SUBSYSTEM  REV 2.1
SESSION OPEN. ALL ACTIVITY IS MONITORED AND RECORDED.</pre>`;
    let menu = `<div class="term-menu">${homeLink("[0] MAIN DIRECTORY")}`;
    let n = 1;
    for (const g of groups) {
      menu += `<div class="term-group">-- ${esc(g.cat.toUpperCase())} --</div>`;
      for (const p of g.pages) menu += link(p, `[${n++}] ${p.title.toUpperCase()}`);
    }
    menu += `${randomLink("[R] RANDOM RECORD")}</div>`;
    nav.innerHTML = menu + searchBox("ENTER RECORD NAME");
    footer.innerHTML = `<pre>END OF RECORD. PRESS [0] TO RETURN TO DIRECTORY.<span class="cursor">█</span></pre>`;
  }

  else if (era === "web90") {
    header.innerHTML = `
      <div class="w90-title">
        <div class="w90-star" aria-hidden="true">★</div>
        <h1 class="w90-agency">${esc(AGENCY)}</h1>
        <div class="w90-sub">Records Archive Home Page</div>
      </div>
      <hr>
      <div class="w90-links">[ ${homeLink("Home")} | ${randomLink("Random Page")} | <a href="#q">Search</a> ]</div>
      <hr>`;
    let html = `<b>Directory</b><ul>`;
    for (const g of groups) {
      html += `<li><b>${esc(g.cat)}</b><ul>${g.pages.map((p) => `<li>${link(p)}</li>`).join("")}</ul></li>`;
    }
    html += `</ul><hr>${searchBox("", "Search")}`;
    nav.innerHTML = html;
    footer.innerHTML = `
      <hr>
      <p><span class="w90-construction">UNDER CONSTRUCTION</span> This page is best viewed with Netscape Navigator 3.0 at 800x600.</p>
      <p>Questions or comments? Contact the <a href="#">Webmaster</a>.</p>
      <p class="w90-counter">You are visitor number <span>004817</span></p>`;
  }

  else if (era === "portal") {
    header.innerHTML = `
      <div class="pt-topbar">
        <span>${esc(AGENCY_SHORT)} Intranet</span>
        <span class="pt-user">Welcome, Guest User ▾</span>
      </div>
      <div class="pt-masthead">
        <button class="menu-btn" aria-label="Open menu" aria-expanded="false">☰</button>
        <div class="pt-logo"><span class="pt-emblem" aria-hidden="true"></span>
          <div><b>${esc(AGENCY_SHORT)} Portal</b><small>${esc(AGENCY)}</small></div>
        </div>
        ${searchBox("Search this site…", "Go")}
      </div>
      <div class="pt-tabs">${homeLink("Home")}${groups.map((g) => `<a href="${root}${g.pages[0].path}">${esc(g.cat)}</a>`).join("")}</div>`;
    let html = `<div class="pt-ql-title">Quick Launch</div>`;
    html += `<ul>${`<li>${homeLink("Directory Home")}</li><li>${randomLink("Random Page")}</li>`}</ul>`;
    for (const g of groups) {
      html += `<div class="pt-ql-head">${esc(g.cat)}</div><ul>${g.pages.map((p) => `<li>${link(p)}</li>`).join("")}</ul>`;
    }
    nav.innerHTML = html;
    footer.innerHTML = `${esc(AGENCY_SHORT)} Portal · Internal use only · Optimized for Internet Explorer 6.0 · © 2006`;
  }

  else {
    /* modern */
    header.innerHTML = `
      <div class="md-official">
        <span class="md-flag" aria-hidden="true"></span>
        An official system of the ${esc(AGENCY)}. Authorized use only.
      </div>
      <div class="md-bar">
        <button class="menu-btn" aria-label="Open menu" aria-expanded="false">☰</button>
        <a class="md-brand" href="${root}index.html">
          <span class="md-emblem" aria-hidden="true"></span>
          <span><b>${esc(AGENCY_SHORT)}</b><small>Records Archive</small></span>
        </a>
        ${searchBox("Search records")}
      </div>`;
    let html = `<div class="nav-group"><h4>Archive</h4><ul><li>${homeLink("Directory")}</li><li>${randomLink("Random record")}</li></ul></div>`;
    for (const g of groups) {
      html += `<div class="nav-group"><h4>${esc(g.cat)}</h4><ul>${g.pages.map((p) => `<li>${link(p)}</li>`).join("")}</ul></div>`;
    }
    nav.innerHTML = html;
    footer.innerHTML = `${esc(AGENCY)} · Records Archive · Project Caelum`;
  }

  /* Assemble the page */
  if (main) {
    main.before(layout);
    layout.append(nav, main);
  } else {
    body.append(layout);
    layout.append(nav);
  }
  body.prepend(bannerTop, header);
  body.append(footer, bannerBottom);

  /* ---------- Behaviour ---------- */
  const menuBtn = header.querySelector(".menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const open = body.classList.toggle("nav-open");
      menuBtn.setAttribute("aria-expanded", open);
    });
  }

  document.querySelectorAll("[data-random]").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const pool = PAGES.filter((p) => p.category !== "Templates");
      const list = pool.length ? pool : PAGES;
      location.href = root + list[Math.floor(Math.random() * list.length)].path;
    })
  );

  const box = document.querySelector(".search");
  const input = box.querySelector("input");
  const results = box.querySelector(".search-results");

  function runSearch() {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.hidden = true; results.innerHTML = ""; return; }
    const hits = PAGES.map((p) => {
      const t = p.title.toLowerCase();
      let score = t.startsWith(q) ? 3 : t.includes(q) ? 2 :
        `${p.summary} ${p.category}`.toLowerCase().includes(q) ? 1 : 0;
      return { p, score };
    }).filter((h) => h.score).sort((a, b) => b.score - a.score).slice(0, 8);

    results.innerHTML = hits.length
      ? hits.map(({ p }) => `<li><a href="${root}${p.path}"><strong>${esc(p.title)}</strong>
          <span><em class="tag tag-${lv(p.class).css}">${lv(p.class).short}</em> ${esc(p.summary)}</span></a></li>`).join("")
      : `<li class="no-results">${era === "terminal" ? "NO MATCHING RECORDS." : `No records match “${esc(input.value)}”`}</li>`;
    results.hidden = false;
  }
  const go = () => { const a = results.querySelector("a"); if (a) location.href = a.getAttribute("href"); };

  input.addEventListener("input", runSearch);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") go();
    if (e.key === "Escape") { results.hidden = true; input.blur(); }
  });
  const goBtn = box.querySelector(".search-go");
  if (goBtn) goBtn.addEventListener("click", () => { runSearch(); go(); });
  document.addEventListener("click", (e) => { if (!box.contains(e.target)) results.hidden = true; });

  /* ---------- Main Page directory ---------- */
  const dir = document.getElementById("directory");
  if (dir) {
    dir.innerHTML = groups.map((g) => `
      <section class="dir-group">
        <h3>${esc(g.cat)}</h3>
        <table class="dir-table">
          <thead><tr><th>Record</th><th>Class.</th><th>System</th><th>Updated</th></tr></thead>
          <tbody>${g.pages.map((p) => `
            <tr>
              <td><a href="${root}${p.path}">${esc(p.title)}</a><span>${esc(p.summary)}</span></td>
              <td><em class="tag tag-${lv(p.class).css}">${lv(p.class).short}</em></td>
              <td class="dir-era">${esc(ERAS[p.era] || "")}</td>
              <td class="dir-date">${esc(p.updated || "")}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </section>`).join("");
  }
  const count = document.getElementById("page-count");
  if (count) count.textContent = PAGES.filter((p) => p.category !== "Templates").length;
})();
