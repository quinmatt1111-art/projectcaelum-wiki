/*
  ADD PAGE TOOL
  -------------
  Opened from "+ Add page" in authorized mode. It builds a new page from one of
  the templates in pages/ and registers it in assets/pages.js.

  Two ways to save:
    - With a GitHub token saved on this device: creates both files directly.
    - Without a token: opens GitHub's "new file" screen with the page filled in,
      and gives you the line to paste into pages.js.

  The token is stored only in this browser (localStorage), never in the repo.
*/
(function () {
  const { root, REPO, BRANCH, LEVELS, ERAS, esc, el } = window.WIKI;
  const TOKEN_KEY = "aerocom-github-token";
  const API = `https://api.github.com/repos/${REPO}/contents/`;

  const FORMATS = {
    modern: "Current System",
    portal: "2000s Portal",
    web90: "1990s Web",
    terminal80: "1980s Terminal (amber)",
    terminal: "1970s Terminal (green)",
    note: "Design Note",
  };

  const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; } };
  const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) {} };

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "new-page";
  const b64encode = (str) => btoa(unescape(encodeURIComponent(str)));
  const b64decode = (b64) => decodeURIComponent(escape(atob(b64.replace(/\n/g, ""))));
  const jsStr = (s) => JSON.stringify(String(s));

  async function gh(path, opts = {}) {
    const headers = { Accept: "application/vnd.github+json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(API + path, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
    if (!res.ok && res.status !== 404) {
      let msg = `GitHub error ${res.status}`;
      try { msg += ": " + (await res.json()).message; } catch (e) {}
      throw new Error(msg);
    }
    return res;
  }

  async function getFile(path) {
    const res = await gh(`${path}?ref=${BRANCH}`);
    if (res.status === 404) return null;
    const data = await res.json();
    return { sha: data.sha, text: b64decode(data.content) };
  }

  async function putFile(path, text, message, sha) {
    await gh(path, {
      method: "PUT",
      body: JSON.stringify({ message, content: b64encode(text), branch: BRANCH, ...(sha ? { sha } : {}) }),
    });
  }

  /* ---------- Build the page from a template ---------- */
  function buildPage(templateHtml, f) {
    // drop the "how to use this template" comment first (it mentions <h1>)
    let html = templateHtml.replace(/<!--[\s\S]*?-->\s*/, "");
    const oldTitle = (html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || "";
    // swap the template's name for the new title everywhere
    if (oldTitle) html = html.split(oldTitle).join(esc(f.title));
    // opening line: title + summary instead of the template's description
    html = html.replace(/<p class="lead">[\s\S]*?<\/p>/,
      `<p class="lead"><strong>${esc(f.title)}</strong>${f.summary ? " — " + esc(f.summary) : ""}</p>`);
    // breadcrumb category
    html = html.replace(/(<div class="breadcrumb">[\s\S]*?›\s*)[^<]*(<\/div>)/, `$1${esc(f.category)}$2`);
    // body settings
    const era = f.format === "note" ? "modern" : f.format;
    const marking = f.marking ? ` data-marking="${esc(f.marking)}"` : "";
    html = html.replace(/<body[^>]*>/, `<body data-root="../" data-era="${era}" data-class="${f.cls}"${marking}>`);
    // paragraph markings above U follow the page's classification
    html = html.replace(/data-pm="(?!U")[^"]*"/g, `data-pm="${f.cls}"`);
    // dates: current-system pages get today; older eras keep their period date
    const isCurrent = f.format === "modern" || f.format === "note";
    const sample = (html.match(/\b(19|20)\d\d-\d\d-\d\d\b/) || [])[0];
    f.updated = isCurrent || !sample ? today() : sample;
    if (isCurrent) html = html.replace(/\b(19|20)\d\d-\d\d-\d\d\b/g, f.updated);
    return html;
  }

  function registryEntry(f, path) {
    const era = f.format === "note" ? "modern" : f.format;
    return [
      "  {",
      `    title: ${jsStr(f.title)},`,
      `    path: ${jsStr(path)},`,
      `    category: ${jsStr(f.category)},`,
      `    summary: ${jsStr(f.summary)},`,
      `    class: ${jsStr(f.cls)},`,
      `    era: ${jsStr(era)},`,
      `    updated: ${jsStr(f.updated || today())},`,
      ...(f.hidden ? ["    hidden: true,"] : []),
      "  },",
    ].join("\n");
  }

  function addToRegistry(js, f, entry) {
    // new category -> add it to CATEGORIES (before "Templates" if present)
    if (!CATEGORIES.includes(f.category)) {
      js = js.replace(/const CATEGORIES = \[([\s\S]*?)\];/, (m, inner) => {
        const line = `  ${jsStr(f.category)},\n`;
        if (inner.includes('"Templates"')) return m.replace(/(\s*)"Templates",/, `\n${line.trimEnd()}$1"Templates",`);
        return `const CATEGORIES = [${inner.replace(/\s*$/, "\n")}${line}];`;
      });
    }
    // append the page at the end of PAGES
    const end = js.lastIndexOf("];");
    if (end === -1) throw new Error("Couldn't find the end of PAGES in pages.js");
    return js.slice(0, end) + entry + "\n" + js.slice(end);
  }

  /* ---------- Dialog ---------- */
  window.openAddPage = function () {
    const catOptions = CATEGORIES.filter((c) => c !== "Templates")
      .map((c) => `<option>${esc(c)}</option>`).join("");
    const levelOptions = Object.entries(LEVELS)
      .map(([k, v]) => `<option value="${k}">${esc(v.text)}</option>`).join("");
    const formatOptions = Object.entries(FORMATS)
      .map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");

    const overlay = el("div", "auth-overlay", `
      <form class="auth-box add-box">
        <div class="auth-title">NEW RECORD</div>

        <label>Title<input name="ptitle" required placeholder="e.g. Vostok Interceptor"></label>
        <label>Summary <small>(one line for search and the directory)</small><input name="summary"></label>

        <label>Category
          <select name="category">${catOptions}<option value="__new">+ New category…</option></select>
        </label>
        <label class="new-cat" hidden>New category name<input name="newcat"></label>

        <div class="add-row">
          <label>Format<select name="format">${formatOptions}</select></label>
          <label>Classification<select name="cls">${levelOptions}</select></label>
        </div>
        <label>Banner text <small>(optional, e.g. SECRET//NOFORN)</small><input name="marking"></label>
        <label class="add-check"><input type="checkbox" name="phidden"> Hidden (authorized mode only)</label>

        <details class="add-token">
          <summary>GitHub connection: <b class="token-state"></b></summary>
          <p>With a token, pages are created instantly. Without one, GitHub opens with the page filled in and you paste one line into <code>pages.js</code>.</p>
          <p>To make a token: GitHub → Settings → Developer settings → Personal access tokens → <b>Fine-grained tokens</b> → Generate. Repository access: <b>only ${esc(REPO.split("/")[1])}</b>. Permissions: <b>Contents → Read and write</b>.</p>
          <input name="token" type="password" placeholder="github_pat_…" autocomplete="off">
          <div class="auth-actions"><button type="button" data-save-token>Save token</button><button type="button" data-clear-token>Remove</button></div>
        </details>

        <p class="add-status" hidden></p>
        <div class="auth-actions">
          <button type="submit">Create page</button>
          <button type="button" data-cancel>Close</button>
        </div>
      </form>`);
    document.body.append(overlay);

    const form = overlay.querySelector("form");
    const F = form.elements;
    const status = overlay.querySelector(".add-status");
    const close = () => overlay.remove();
    const say = (html, isError) => { status.hidden = false; status.className = "add-status" + (isError ? " error" : ""); status.innerHTML = html; };
    const refreshToken = () => { overlay.querySelector(".token-state").textContent = getToken() ? "connected" : "not connected"; };
    refreshToken();
    F.ptitle.focus();

    overlay.querySelector("[data-cancel]").addEventListener("click", close);
    F.category.addEventListener("change", () => {
      overlay.querySelector(".new-cat").hidden = F.category.value !== "__new";
      if (F.category.value === "Design Notes") { F.format.value = "note"; F.phidden.checked = true; }
    });
    F.format.addEventListener("change", () => {
      if (F.format.value === "note") F.phidden.checked = true;
    });
    overlay.querySelector("[data-save-token]").addEventListener("click", () => {
      setToken(F.token.value.trim()); F.token.value = ""; refreshToken();
    });
    overlay.querySelector("[data-clear-token]").addEventListener("click", () => { setToken(""); refreshToken(); });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = {
        title: F.ptitle.value.trim(),
        summary: F.summary.value.trim(),
        category: F.category.value === "__new" ? F.newcat.value.trim() : F.category.value,
        format: F.format.value,
        cls: F.cls.value,
        marking: F.marking.value.trim(),
        hidden: F.phidden.checked,
      };
      if (!f.title) return say("Give the page a title.", true);
      if (!f.category) return say("Name the new category.", true);

      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      try {
        say("Loading template…");
        const tpl = await getFile(`pages/_template-${f.format}.html`);
        if (!tpl) throw new Error(`Template pages/_template-${f.format}.html not found`);
        const pageHtml = buildPage(tpl.text, f);

        // pick a free file name
        let slug = slugify(f.title), path = `pages/${slug}.html`, n = 2;
        while (PAGES.some((p) => p.path === path)) path = `pages/${slug}-${n++}.html`;
        const entry = registryEntry(f, path);

        if (getToken()) {
          while (await getFile(path)) path = `pages/${slug}-${n++}.html`;
          say("Creating page…");
          await putFile(path, pageHtml, `Add page: ${f.title}`);
          say("Adding it to pages.js…");
          const reg = await getFile("assets/pages.js");
          await putFile("assets/pages.js", addToRegistry(reg.text, f, registryEntry(f, path)), `Register page: ${f.title}`, reg.sha);
          say(`<b>Created ${esc(path)}.</b> It'll be live in about a minute.<br>
            <a href="https://github.com/${REPO}/edit/${BRANCH}/${path}" target="_blank" rel="noopener">Write the content on GitHub</a>
            · <a href="${root}${path}">Open page</a> (after it goes live)`);
          form.reset(); refreshToken();
        } else {
          const url = `https://github.com/${REPO}/new/${BRANCH}?filename=${encodeURIComponent(path)}&value=${encodeURIComponent(pageHtml)}`;
          say(`<b>Step 1:</b> <a href="${url}" target="_blank" rel="noopener">Open GitHub with the page filled in</a> and tap <i>Commit</i>.<br>
            <b>Step 2:</b> <a href="#" data-copy>Copy this line</a>, then
            <a href="https://github.com/${REPO}/edit/${BRANCH}/assets/pages.js" target="_blank" rel="noopener">edit pages.js</a>
            and paste it just above the last <code>];</code>${CATEGORIES.includes(f.category) ? "" : `. Also add <code>${esc(jsStr(f.category))},</code> to CATEGORIES`}.
            <textarea readonly rows="6">${esc(entry)}</textarea>`);
          status.querySelector("[data-copy]").addEventListener("click", async (ev) => {
            ev.preventDefault();
            const ta = status.querySelector("textarea");
            try { await navigator.clipboard.writeText(ta.value); } catch (err) { ta.select(); document.execCommand("copy"); }
            ev.target.textContent = "Copied!";
          });
        }
      } catch (err) {
        say(esc(err.message), true);
      } finally {
        submit.disabled = false;
      }
    });
  };
})();
