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
  const REPO = "quinmatt1111-art/projectcaelum-wiki"; // used by the Add page button
  const BRANCH = "main";

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
    terminal80: "ADN-2 System (1980s)",
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

  /* ---------- Authorized mode ----------
     Pages with  hidden: true  in pages.js only appear after entering
     ACCESS_CODE (set in pages.js). This hides pages from casual visitors;
     it is NOT real security — the files are still public on GitHub. */
  const AUTH_KEY = "aerocom-authorized";
  const CODE = typeof ACCESS_CODE === "string" ? ACCESS_CODE : "";
  let authorized = false;
  try { authorized = !!CODE && localStorage.getItem(AUTH_KEY) === CODE; } catch (e) {}
  if (authorized) body.classList.add("authorized");

  const VISIBLE = PAGES.filter((p) => authorized || !p.hidden);
  const thisPage = PAGES.find((p) => isCurrent(p.path));
  const denied = !!(thisPage && thisPage.hidden && !authorized);

  const authLink = (inLabel, outLabel) =>
    `<a href="#" data-auth>${authorized ? outLabel : inLabel}</a>`;

  /* ---------- Navigation data ---------- */
  const groups = CATEGORIES
    .map((cat) => ({ cat, pages: VISIBLE.filter((p) => p.category === cat) }))
    .filter((g) => g.pages.length);

  const link = (p, label) => {
    const cls = [isCurrent(p.path) && "current", p.hidden && "restricted"].filter(Boolean).join(" ");
    return `<a href="${root}${p.path}"${cls ? ` class="${cls}"` : ""}>${esc(label ?? p.title)}</a>`;
  };
  const homeLink = (label) =>
    `<a href="${root}index.html"${isCurrent("index.html") ? ' class="current"' : ""}>${label}</a>`;
  const randomLink = (label) => `<a href="#" data-random>${label}</a>`;

  /* Pages in menu order; terminal menus number them 1, 2, 3… */
  const numbered = groups.flatMap((g) => g.pages);

  /* Terminal command line (70s and 80s): typed commands at the bottom */
  const prompt = (label, cursor) => `
      <div class="term-log" aria-live="polite"></div>
      <div class="term-prompt"><span class="tp-label">${label}</span><span class="tp-text"></span><span class="cursor">${cursor}</span><input class="tp-input" aria-label="Command" autocomplete="off" autocapitalize="characters" spellcheck="false"></div>`;

  /* ---------- Search box (shared logic, era-specific look) ---------- */
  function searchBox(placeholder, button) {
    return `
      <div class="search">
        ${era === "terminal" ? '<label for="q">QUERY&gt;</label>' : ""}
        ${era === "terminal80" ? '<label for="q">FIND ===&gt;</label>' : ""}
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
    menu += `${randomLink("[R] RANDOM RECORD")}${authLink("[A] AUTHORIZE", "[A] END AUTHORIZED SESSION")}</div>`;
    nav.innerHTML = menu + searchBox("ENTER RECORD NAME");
    footer.innerHTML = `<div class="term-line">END OF RECORD. TYPE A NUMBER, A RECORD NAME, OR HELP.</div>${prompt("&gt; ", "█")}`;
  }

  else if (era === "terminal80") {
    const now = new Date();
    header.innerHTML = `
      <div class="t80-status">
        <span>${AGENCY_SHORT} ADN-2</span>
        <span>RECORDS INFORMATION SYSTEM</span>
        <span>TERM T0412</span>
      </div>
      <div class="t80-title">USER: ${authorized ? "AUTHORIZED" : "GUEST"} &nbsp; ACCESS LEVEL: ${authorized ? "TOP CLEARANCE" : "STANDARD"} &nbsp; DATE: 1987-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}</div>`;
    let menu = `<div class="t80-box" data-title="MAIN MENU"><div class="t80-opt">${homeLink("<b>0</b> RECORDS DIRECTORY")}</div>`;
    let n = 1;
    for (const g of groups) {
      menu += `<div class="t80-group">${esc(g.cat.toUpperCase())}</div>`;
      for (const p of g.pages) menu += `<div class="t80-opt">${link(p, "")}</div>`.replace("></a>", `><b>${n++}</b> ${esc(p.title)}</a>`);
    }
    menu += `</div>`;
    nav.innerHTML = menu + searchBox("");
    footer.innerHTML = `
      <div class="t80-msg">${prompt("COMMAND ===&gt; ", "_")}</div>
      <div class="t80-fkeys">
        <a href="#" data-cmd="HELP">F1=HELP</a>
        <a href="${root}index.html">F3=EXIT</a>
        <a href="#" data-random>F5=RANDOM</a>
        <a href="#" data-cmd="BACK">F7=BACK</a>
        <a href="#q">F9=QUERY</a>
        ${authLink("F12=AUTHORIZE", "F12=END SESSION")}
      </div>`;
  }

  else if (era === "web90") {
    header.innerHTML = `
      <div class="w90-title">
        <div class="w90-star" aria-hidden="true">★</div>
        <h1 class="w90-agency">${esc(AGENCY)}</h1>
        <div class="w90-sub">Records Archive Home Page</div>
      </div>
      <hr>
      <div class="w90-links">[ ${homeLink("Home")} | ${randomLink("Random Page")} | <a href="#q">Search</a> | ${authLink("Staff Login", "Log Out")} ]</div>
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
        <span class="pt-user">Welcome, ${authorized ? "Authorized User" : "Guest User"} | ${authLink("Sign In", "Sign Out")}</span>
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
    let html = `<div class="nav-group"><h4>Archive</h4><ul><li>${homeLink("Directory")}</li><li>${randomLink("Random record")}</li><li>${authLink("Authorized access", "End authorized session")}</li></ul></div>`;
    for (const g of groups) {
      html += `<div class="nav-group"><h4>${esc(g.cat)}</h4><ul>${g.pages.map((p) => `<li>${link(p)}</li>`).join("")}</ul></div>`;
    }
    nav.innerHTML = html;
    footer.innerHTML = `${esc(AGENCY)} · Records Archive · Project Caelum`;
  }

  /* Access denied: replace the content of a hidden page */
  if (denied && main) {
    document.title = "ACCESS DENIED";
    main.innerHTML = `
      <div class="denied">
        <div class="denied-title">ACCESS DENIED</div>
        <p>This record is restricted. Your current access level does not permit viewing it.</p>
        <p>All access attempts are logged.</p>
        <p><a href="#" data-auth>Enter access code</a> &nbsp;·&nbsp; <a href="${root}index.html">Return to directory</a></p>
      </div>`;
  }

  /* Strip shown under the top banner while authorized */
  const authStrip = authorized
    ? el("div", "auth-strip", `AUTHORIZED SESSION — RESTRICTED RECORDS VISIBLE · <a href="#" data-addpage>+ Add page</a> · <a href="#" data-auth>End session</a>`)
    : null;

  /* Assemble the page */
  if (main) {
    main.before(layout);
    layout.append(nav, main);
  } else {
    body.append(layout);
    layout.append(nav);
  }
  body.prepend(bannerTop, ...(authStrip ? [authStrip] : []), header);
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
      const pool = VISIBLE.filter((p) => p.category !== "Templates" && !isCurrent(p.path));
      const list = pool.length ? pool : VISIBLE;
      location.href = root + list[Math.floor(Math.random() * list.length)].path;
    })
  );

  /* Search scoring shared by the search box and the terminal prompt */
  function findPages(q) {
    q = q.toLowerCase();
    return VISIBLE.map((p) => {
      const t = p.title.toLowerCase();
      const score = t === q ? 4 : t.startsWith(q) ? 3 : t.includes(q) ? 2 :
        `${p.summary} ${p.category}`.toLowerCase().includes(q) ? 1 : 0;
      return { p, score };
    }).filter((h) => h.score).sort((a, b) => b.score - a.score);
  }

  /* Authorize / end session */
  function openAuth() {
    if (!CODE) { alertBox("No access code is set. Add ACCESS_CODE to assets/pages.js."); return; }
    const overlay = el("div", "auth-overlay", `
      <form class="auth-box">
        <div class="auth-title">AUTHORIZATION REQUIRED</div>
        <label for="auth-code">Enter access code</label>
        <input id="auth-code" type="password" autocomplete="current-password">
        <p class="auth-error" hidden>ACCESS CODE REJECTED. ATTEMPT LOGGED.</p>
        <div class="auth-actions">
          <button type="submit">Authorize</button>
          <button type="button" data-cancel>Cancel</button>
        </div>
      </form>`);
    body.append(overlay);
    const form = overlay.querySelector("form");
    const field = overlay.querySelector("input");
    field.focus();
    const close = () => overlay.remove();
    overlay.querySelector("[data-cancel]").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (field.value.trim() === CODE) {
        try { localStorage.setItem(AUTH_KEY, CODE); } catch (err) {}
        location.reload();
      } else {
        overlay.querySelector(".auth-error").hidden = false;
        field.select();
      }
    });
  }
  function alertBox(msg) {
    const overlay = el("div", "auth-overlay", `<div class="auth-box"><p>${esc(msg)}</p>
      <div class="auth-actions"><button type="button">OK</button></div></div>`);
    body.append(overlay);
    overlay.querySelector("button").addEventListener("click", () => overlay.remove());
  }
  document.querySelectorAll("[data-auth]").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (authorized) {
        try { localStorage.removeItem(AUTH_KEY); } catch (err) {}
        location.reload();
      } else openAuth();
    })
  );

  /* Add page tool (authorized only) — loaded from assets/addpage.js */
  if (authorized) {
    window.WIKI = { root, era, REPO, BRANCH, LEVELS, ERAS, esc, el };
    const addBtn = document.querySelector("[data-addpage]");
    addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.openAddPage) return window.openAddPage();
      const sc = document.createElement("script");
      sc.src = root + "assets/addpage.js";
      sc.onload = () => window.openAddPage();
      document.head.append(sc);
    });
  }

  const box = document.querySelector(".search");
  const input = box.querySelector("input");
  const results = box.querySelector(".search-results");

  function runSearch() {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.hidden = true; results.innerHTML = ""; return; }
    const hits = findPages(q).slice(0, 8);

    results.innerHTML = hits.length
      ? hits.map(({ p }) => `<li><a href="${root}${p.path}"${p.hidden ? ' class="restricted"' : ""}><strong>${esc(p.title)}</strong>
          <span><em class="tag tag-${lv(p.class).css}">${lv(p.class).short}</em> ${esc(p.summary)}</span></a></li>`).join("")
      : `<li class="no-results">${era.startsWith("terminal") ? "NO MATCHING RECORDS." : `No records match “${esc(input.value)}”`}</li>`;
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

  /* ---------- Terminal command line ---------- */
  const tp = document.querySelector(".term-prompt");
  if (tp) {
    const tpInput = tp.querySelector(".tp-input");
    const tpText = tp.querySelector(".tp-text");
    const log = document.querySelector(".term-log");
    const up = (s) => (era === "terminal" ? String(s).toUpperCase() : String(s));

    const print = (...lines) => {
      for (const line of lines) {
        const d = el("div", "term-line");
        d.innerHTML = line;
        log.append(d);
      }
      while (log.children.length > 40) log.firstChild.remove();
      reveal();
    };
    const reveal = () => tp.scrollIntoView({ block: "nearest" });
    const go = (path) => { location.href = root + path; };
    const click = (sel) => { const a = document.querySelector(sel); if (a) a.click(); return !!a; };

    const HELP = [
      "AVAILABLE COMMANDS:",
      "  0 / DIR ........ RETURN TO DIRECTORY",
      `  ${numbered.length > 1 ? "1-" + numbered.length : "1  "} ........... OPEN NUMBERED RECORD`,
      "  NAME ........... OPEN OR FIND A RECORD BY NAME",
      "  FIND text ...... SEARCH RECORDS",
      "  R / RANDOM ..... RANDOM RECORD",
      "  BACK ........... PREVIOUS SCREEN",
      `  A / AUTH ....... ${authorized ? "END AUTHORIZED SESSION" : "ENTER ACCESS CODE"}`,
      ...(authorized ? ["  ADD ............ CREATE A NEW RECORD"] : []),
      "  CLEAR .......... CLEAR SCREEN",
    ];

    function listHits(hits) {
      print(`${hits.length} MATCHING RECORDS:`, ...hits.slice(0, 6).map(({ p }) => {
        const i = numbered.indexOf(p);
        return `  <a href="${root}${p.path}">${i >= 0 ? `[${i + 1}] ` : ""}${esc(up(p.title))}</a>`;
      }));
    }

    function run(raw) {
      const cmd = raw.trim();
      if (!cmd) return;
      print(`&gt; ${esc(up(cmd))}`);
      const [word, ...rest] = cmd.split(/\s+/);
      const W = word.toUpperCase();
      const arg = rest.join(" ");

      if (/^\d+$/.test(cmd)) {
        const n = parseInt(cmd, 10);
        if (n === 0) return go("index.html");
        if (numbered[n - 1]) return go(numbered[n - 1].path);
        return print(`INVALID SELECTION: ${n}`);
      }
      switch (W) {
        case "HELP": case "?": case "F1": return print(...HELP);
        case "DIR": case "MENU": case "EXIT": case "HOME": case "F3": return go("index.html");
        case "R": case "RANDOM": case "F5": return click("[data-random]");
        case "BACK": case "B": case "F7": print("RETURNING TO PREVIOUS SCREEN..."); return history.back();
        case "A": case "AUTH": case "AUTHORIZE": case "LOGIN": case "LOGOUT": case "F12": return click("[data-auth]");
        case "ADD": case "NEW":
          return authorized ? click("[data-addpage]") : print("ACCESS DENIED. AUTHORIZATION REQUIRED.");
        case "CLEAR": case "CLS": log.innerHTML = ""; return;
        case "F9": return document.getElementById("q").focus();
        case "FIND": case "SEARCH": case "QUERY": {
          if (!arg) return print("USAGE: FIND text");
          const hits = findPages(arg);
          return hits.length ? listHits(hits) : print("NO MATCHING RECORDS.");
        }
      }
      // anything else: treat as a record name
      const hits = findPages(cmd);
      if (hits.length && (hits[0].score === 4 || hits.length === 1)) return go(hits[0].p.path);
      if (hits.length) return listHits(hits);
      print(`UNKNOWN COMMAND OR RECORD: ${esc(up(cmd))}`, "TYPE HELP FOR A LIST OF COMMANDS.");
    }

    if (era === "terminal80") print("READY.");
    const sync = () => { tpText.textContent = up(tpInput.value); reveal(); };
    tpInput.addEventListener("input", sync);
    tpInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); const v = tpInput.value; tpInput.value = ""; sync(); run(v); }
    });
    tp.addEventListener("click", () => tpInput.focus());
    document.querySelectorAll("[data-cmd]").forEach((a) =>
      a.addEventListener("click", (e) => { e.preventDefault(); run(a.dataset.cmd); }));

    // Typing anywhere on the page goes to the prompt
    document.addEventListener("keydown", (e) => {
      const t = document.activeElement;
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      tpInput.focus({ preventScroll: true });
    });
    // On computers, start with the prompt ready
    if (window.matchMedia("(pointer: fine)").matches) tpInput.focus({ preventScroll: true });
  }

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
              <td><a href="${root}${p.path}"${p.hidden ? ' class="restricted"' : ""}>${esc(p.title)}</a><span>${esc(p.summary)}</span></td>
              <td><em class="tag tag-${lv(p.class).css}">${lv(p.class).short}</em></td>
              <td class="dir-era">${esc(ERAS[p.era] || "")}</td>
              <td class="dir-date">${esc(p.updated || "")}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </section>`).join("");
  }
  const count = document.getElementById("page-count");
  if (count) count.textContent = VISIBLE.filter((p) => p.category !== "Templates").length;
})();
