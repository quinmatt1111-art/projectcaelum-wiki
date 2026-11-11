/*
  ADMIN TOOLS (authorized mode only)
  ----------------------------------
  1. ADD PAGE: "+ Add page" builds a new page from one of the templates in
     pages/ and registers it in assets/pages.js.
  2. PAGE EDITOR: "✎ Edit this page" makes the page editable in place, with a
     toolbar, page settings and image upload. Saving needs a GitHub token.

  Two ways to save:
    - With a GitHub token saved on this device: creates both files directly.
    - Without a token: opens GitHub's "new file" screen with the page filled in,
      and gives you the line to paste into pages.js.

  The token is stored only in this browser (localStorage), never in the repo.
*/
(function () {
  const { root, era, REPO, BRANCH, LEVELS, ERAS, esc, el, thisPage, editPath } = window.WIKI;
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

  function ensureCategory(js, cat) {
    // new category -> add it to CATEGORIES (before "Templates" if present)
    if (CATEGORIES.includes(cat)) return js;
    return js.replace(/const CATEGORIES = \[([\s\S]*?)\];/, (m, inner) => {
      const line = `  ${jsStr(cat)},\n`;
      if (inner.includes('"Templates"')) return m.replace(/(\s*)"Templates",/, `\n${line.trimEnd()}$1"Templates",`);
      return `const CATEGORIES = [${inner.replace(/\s*$/, "\n")}${line}];`;
    });
  }

  function addToRegistry(js, f, entry) {
    js = ensureCategory(js, f.category);
    // append the page at the end of PAGES
    const end = js.lastIndexOf("];");
    if (end === -1) throw new Error("Couldn't find the end of PAGES in pages.js");
    return js.slice(0, end) + entry + "\n" + js.slice(end);
  }

  /* ---------- Dialog ---------- */
  function openAddPage() {
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
          say(`<b>Created ${esc(path)}.</b> It'll be live in a minute or two. If it doesn't show up, press Ctrl+F5 (or pull down to refresh on a phone).<br>
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
  }

  /* =====================================================================
     PAGE EDITOR
     ===================================================================== */
  const MARKS = ["", "U", "CUI", "C", "S", "TS"];

  function updateRegistryEntry(js, path, entry, category) {
    js = ensureCategory(js, category);
    const i = js.indexOf(`path: ${jsStr(path)}`);
    if (i < 0) return js;
    const start = js.lastIndexOf("{", i);
    const lineStart = js.lastIndexOf("\n", start) + 1;
    let end = js.indexOf("}", i) + 1;
    if (js[end] === ",") end++;
    return js.slice(0, lineStart) + entry + js.slice(end);
  }

  /* Turn the edited <main> back into tidy HTML */
  function cleanContent(main) {
    const copy = main.cloneNode(true);
    copy.removeAttribute("contenteditable");
    // generated parts of the Main Page are rebuilt on load
    copy.querySelectorAll("#directory, #page-count").forEach((n) => { n.innerHTML = n.id === "page-count" ? "0" : ""; });
    copy.querySelectorAll("[contenteditable]").forEach((n) => n.removeAttribute("contenteditable"));
    copy.querySelectorAll("[style]").forEach((n) => n.removeAttribute("style"));
    copy.querySelectorAll("img[data-real-src]").forEach((img) => {
      img.setAttribute("src", img.dataset.realSrc); img.removeAttribute("data-real-src");
    });
    copy.querySelectorAll("span").forEach((n) => { if (!n.attributes.length) n.replaceWith(...n.childNodes); });
    copy.querySelectorAll("font").forEach((n) => n.replaceWith(...n.childNodes));
    copy.querySelectorAll("b").forEach((n) => { const s = document.createElement("strong"); s.append(...n.childNodes); n.replaceWith(s); });
    copy.querySelectorAll("i").forEach((n) => { const s = document.createElement("em"); s.append(...n.childNodes); n.replaceWith(s); });
    // loose text or bare <div>s at the top level become paragraphs
    for (const n of [...copy.childNodes]) {
      if (n.nodeType === 3 && n.textContent.trim()) { const p = document.createElement("p"); p.textContent = n.textContent.trim(); n.replaceWith(p); }
      else if (n.nodeType === 1 && n.tagName === "DIV" && !n.attributes.length) { const p = document.createElement("p"); p.append(...n.childNodes); n.replaceWith(p); }
    }
    // drop empty paragraphs
    copy.querySelectorAll("p").forEach((p) => { if (!p.textContent.trim() && !p.querySelector("img") && !p.attributes.length) p.remove(); });
    const parts = [...copy.children].map((n) => "    " + n.outerHTML.trim());
    return "\n" + parts.join("\n\n") + "\n  ";
  }

  function openEditor() {
    if (document.body.classList.contains("editing")) return;
    const main = document.querySelector("main");
    const isIndex = editPath === "index.html";
    const meta = thisPage ? { ...thisPage } : null;
    let source = null; // { sha, text } of the page file
    let savedRange = null;

    document.body.classList.add("editing");
    const bar = el("div", "ed-bar", `
      <div class="ed-tools">
        <select data-block title="Text style">
          <option value="p">Paragraph</option><option value="h2">Heading</option><option value="h3">Subheading</option>
        </select>
        <button data-cmd="bold" title="Bold"><b>B</b></button>
        <button data-cmd="italic" title="Italic"><i>I</i></button>
        <button data-cmd="insertUnorderedList" title="Bullet list">• List</button>
        <button data-cmd="insertOrderedList" title="Numbered list">1. List</button>
        <button data-link title="Link to another page">Link</button>
        <button data-redact title="Black out the selected words">Redact</button>
        <select data-mark title="Paragraph marking">
          <option value="">Marking…</option>${MARKS.map((m) => `<option value="${m || "none"}">${m ? "(" + m + ")" : "No marking"}</option>`).join("")}
        </select>
        <button data-notice title="Turn this paragraph into a notice box">Notice</button>
        <button data-image title="Upload an image">Image</button>
        <button data-inforow title="Add a row to the info box">+ Info row</button>
        <button data-undo title="Undo">↶</button>
      </div>
      <div class="ed-actions">
        <span class="ed-status">Loading…</span>
        ${meta ? '<button data-settings>Page settings</button>' : ""}
        <button data-cancel>Cancel</button>
        <button data-save class="ed-save" disabled>Save</button>
      </div>
      <input type="file" accept="image/*" data-file hidden>`);
    document.body.append(bar);
    const status = bar.querySelector(".ed-status");
    const saveBtn = bar.querySelector("[data-save]");
    const say = (t, err) => { status.textContent = t; status.classList.toggle("error", !!err); };

    // keep the selection when using the toolbar
    document.addEventListener("selectionchange", () => {
      const sel = getSelection();
      if (sel.rangeCount && main.contains(sel.anchorNode)) savedRange = sel.getRangeAt(0).cloneRange();
    });
    const restore = () => {
      main.focus({ preventScroll: true });
      if (savedRange) { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(savedRange); }
    };
    const blockOf = (node) => {
      while (node && node !== main) {
        if (node.nodeType === 1 && node.parentElement === main) return node;
        if (node.nodeType === 1 && /^(P|H2|H3|LI|TD|TH)$/.test(node.tagName)) return node;
        node = node.parentNode;
      }
      return null;
    };
    bar.querySelectorAll("button").forEach((b) => b.addEventListener("mousedown", (e) => e.preventDefault()));

    // load the page's real source from GitHub so we never save the generated menus
    (async () => {
      try {
        source = await getFile(editPath);
        if (!source) throw new Error("Couldn't load " + editPath);
        const m = source.text.match(/<main[^>]*>([\s\S]*?)<\/main>/);
        if (!m) throw new Error("This page has no <main> section to edit");
        main.innerHTML = m[1];
        if (meta) meta.marking = (source.text.match(/<body[^>]*data-marking="([^"]*)"/) || [])[1] || "";
        main.contentEditable = "true";
        try { document.execCommand("defaultParagraphSeparator", false, "p"); document.execCommand("styleWithCSS", false, false); } catch (e) {}
        saveBtn.disabled = false;
        say(getToken() ? "Editing" : "Editing · no GitHub token yet");
        main.focus({ preventScroll: true });
      } catch (err) { say(err.message, true); }
    })();

    /* ----- toolbar actions ----- */
    bar.querySelectorAll("[data-cmd]").forEach((b) => b.addEventListener("click", () => {
      restore(); document.execCommand(b.dataset.cmd);
    }));
    bar.querySelector("[data-undo]").addEventListener("click", () => { restore(); document.execCommand("undo"); });
    bar.querySelector("[data-block]").addEventListener("change", (e) => {
      restore(); document.execCommand("formatBlock", false, e.target.value); e.target.value = "p";
    });
    bar.querySelector("[data-mark]").addEventListener("change", (e) => {
      const v = e.target.value; e.target.value = "";
      restore();
      const blk = savedRange && blockOf(savedRange.startContainer);
      if (!blk) return say("Click in a paragraph first", true);
      if (v === "none") blk.removeAttribute("data-pm"); else blk.setAttribute("data-pm", v);
    });
    bar.querySelector("[data-redact]").addEventListener("click", () => {
      restore();
      const sel = getSelection();
      if (!sel.rangeCount) return;
      let n = sel.anchorNode;
      const existing = n && (n.nodeType === 1 ? n : n.parentElement).closest(".redact");
      if (existing && main.contains(existing)) { existing.replaceWith(...existing.childNodes); return; }
      if (sel.isCollapsed) return say("Select the words to redact", true);
      const span = document.createElement("span");
      span.className = "redact";
      try { sel.getRangeAt(0).surroundContents(span); }
      catch (e) { span.append(sel.getRangeAt(0).extractContents()); sel.getRangeAt(0).insertNode(span); }
    });
    bar.querySelector("[data-notice]").addEventListener("click", () => {
      restore();
      const blk = savedRange && blockOf(savedRange.startContainer);
      const notice = blk && blk.closest(".notice");
      if (notice) { const p = document.createElement("p"); p.append(...notice.childNodes); notice.replaceWith(p); return; }
      if (!blk || blk.parentElement !== main) return say("Click in a paragraph first", true);
      const d = document.createElement("div"); d.className = "notice"; d.append(...blk.childNodes); blk.replaceWith(d);
    });
    bar.querySelector("[data-link]").addEventListener("click", () => {
      restore();
      const sel = getSelection();
      const words = sel.toString();
      const options = PAGES.map((p, i) => `<option value="${i}">${esc(p.title)}</option>`).join("");
      const ov = el("div", "auth-overlay", `
        <form class="auth-box add-box">
          <div class="auth-title">INSERT LINK</div>
          <label>Link to page<select name="page"><option value="">— web address below —</option>${options}</select></label>
          <label>…or web address<input name="url" placeholder="https://"></label>
          <label>Link text<input name="text" value="${esc(words)}"></label>
          <div class="auth-actions"><button type="submit">Insert</button><button type="button" data-x>Cancel</button></div>
        </form>`);
      document.body.append(ov);
      const f = ov.querySelector("form").elements;
      ov.querySelector("[data-x]").addEventListener("click", () => ov.remove());
      ov.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const page = f.page.value !== "" ? PAGES[+f.page.value] : null;
        // pages in pages/ link to each other by file name; index.html links in with pages/…
        const href = page ? (editPath.startsWith("pages/") ? page.path.replace(/^pages\//, "") : page.path) : f.url.value.trim();
        const text = f.text.value.trim() || (page ? page.title : href);
        ov.remove();
        if (!href) return;
        restore();
        document.execCommand("insertHTML", false, `<a href="${esc(href)}">${esc(text)}</a>`);
      });
    });
    bar.querySelector("[data-inforow]").addEventListener("click", () => {
      let box = main.querySelector(".infobox");
      if (!box) {
        box = el("aside", "infobox", `<div class="infobox-title">${esc(meta ? meta.title : "Info")}</div>
          <div class="infobox-image">Image pending</div><table><tbody></tbody></table>`);
        const h1 = main.querySelector("h1");
        h1 ? h1.after(box) : main.prepend(box);
      }
      const tb = box.querySelector("tbody") || box.querySelector("table");
      const tr = document.createElement("tr");
      tr.innerHTML = "<th>Field</th><td>Value</td>";
      tb.append(tr);
      say("Row added. Click it to edit; empty rows are removed on save.");
    });

    // images: upload to images/ and insert (into the info box picture if the cursor is there)
    const fileInput = bar.querySelector("[data-file]");
    bar.querySelector("[data-image]").addEventListener("click", () => {
      if (!getToken()) return askToken();
      fileInput.click();
    });
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      fileInput.value = "";
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) return say("That image is over 8 MB. Try a smaller one.", true);
      const ext = (file.name.match(/\.[a-z0-9]+$/i) || [".png"])[0].toLowerCase();
      const name = `${slugify(file.name.replace(/\.[^.]+$/, ""))}-${Date.now().toString(36)}${ext}`;
      say("Uploading image…");
      try {
        const data = await new Promise((res, rej) => {
          const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file);
        });
        await gh(`images/${name}`, { method: "PUT", body: JSON.stringify({ message: `Upload image ${name}`, content: data, branch: BRANCH }) });
        const real = (editPath.startsWith("pages/") ? "../" : "") + "images/" + name;
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.dataset.realSrc = real;
        img.alt = "";
        const target = savedRange && (savedRange.startContainer.nodeType === 1 ? savedRange.startContainer : savedRange.startContainer.parentElement).closest(".infobox-image");
        if (target) { target.innerHTML = ""; target.append(img); }
        else { restore(); const sel = getSelection(); if (sel.rangeCount) sel.getRangeAt(0).insertNode(img); else main.append(img); }
        say("Image uploaded");
      } catch (err) { say(err.message, true); }
    });

    /* ----- page settings ----- */
    const settingsBtn = bar.querySelector("[data-settings]");
    if (settingsBtn) settingsBtn.addEventListener("click", () => {
      const catOptions = CATEGORIES.map((c) => `<option${c === meta.category ? " selected" : ""}>${esc(c)}</option>`).join("");
      const levelOptions = Object.entries(LEVELS).map(([k, v]) => `<option value="${k}"${k === meta.class ? " selected" : ""}>${esc(v.text)}</option>`).join("");
      const eraOptions = Object.entries(ERAS).map(([k, v]) => `<option value="${k}"${k === meta.era ? " selected" : ""}>${esc(v)}</option>`).join("");
      const curMarking = (source && (source.text.match(/<body[^>]*data-marking="([^"]*)"/) || [])[1]) || "";
      const ov = el("div", "auth-overlay", `
        <form class="auth-box add-box">
          <div class="auth-title">PAGE SETTINGS</div>
          <label>Title<input name="ptitle" value="${esc(meta.title)}"></label>
          <label>Summary<input name="summary" value="${esc(meta.summary || "")}"></label>
          <label>Category<select name="category">${catOptions}<option value="__new">+ New category…</option></select></label>
          <label class="new-cat" hidden>New category name<input name="newcat"></label>
          <div class="add-row">
            <label>System<select name="era">${eraOptions}</select></label>
            <label>Classification<select name="cls">${levelOptions}</select></label>
          </div>
          <label>Banner text <small>(optional)</small><input name="marking" value="${esc(meta.marking || curMarking)}"></label>
          <label>Last updated <small>(shown in the directory)</small><input name="updated" value="${esc(meta.updated || "")}"></label>
          <label class="add-check"><input type="checkbox" name="phidden"${meta.hidden ? " checked" : ""}> Hidden (authorized mode only)</label>
          <p class="add-status">Changes apply when you press Save.</p>
          <div class="auth-actions"><button type="submit">Done</button><button type="button" data-x>Cancel</button></div>
        </form>`);
      document.body.append(ov);
      const F = ov.querySelector("form").elements;
      F.category.addEventListener("change", () => { ov.querySelector(".new-cat").hidden = F.category.value !== "__new"; });
      ov.querySelector("[data-x]").addEventListener("click", () => ov.remove());
      ov.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        meta.title = F.ptitle.value.trim() || meta.title;
        meta.summary = F.summary.value.trim();
        meta.category = F.category.value === "__new" ? (F.newcat.value.trim() || meta.category) : F.category.value;
        meta.era = F.era.value;
        meta.class = F.cls.value;
        meta.marking = F.marking.value.trim();
        meta.updated = F.updated.value.trim();
        meta.hidden = F.phidden.checked;
        meta.changed = true;
        ov.remove();
        say("Settings changed · press Save");
      });
    });

    /* ----- token prompt ----- */
    function askToken(then) {
      const ov = el("div", "auth-overlay", `
        <form class="auth-box add-box">
          <div class="auth-title">GITHUB TOKEN NEEDED</div>
          <p>Saving changes needs your GitHub token (the same one used by + Add page).</p>
          <label>Token<input name="token" type="password" placeholder="github_pat_…" autocomplete="off"></label>
          <div class="auth-actions"><button type="submit">Save token</button><button type="button" data-x>Cancel</button></div>
        </form>`);
      document.body.append(ov);
      ov.querySelector("[data-x]").addEventListener("click", () => ov.remove());
      ov.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        setToken(ov.querySelector("input").value.trim());
        ov.remove();
        say("Token saved");
        if (then) then();
      });
    }

    /* ----- save / cancel ----- */
    bar.querySelector("[data-cancel]").addEventListener("click", () => {
      if (confirmLeave()) location.reload();
    });
    let dirty = false;
    main.addEventListener("input", () => { dirty = true; });
    const confirmLeave = () => !dirty && !(meta && meta.changed) ? true :
      window.confirm("Discard your unsaved changes?");
    window.addEventListener("beforeunload", (e) => { if (dirty && !saving) { e.preventDefault(); e.returnValue = ""; } });

    let saving = false;
    async function save() {
      if (!getToken()) return askToken(save);
      saving = true; saveBtn.disabled = true;
      try {
        // tidy up empty info box rows
        main.querySelectorAll(".infobox tr").forEach((tr) => { if (!tr.textContent.trim()) tr.remove(); });
        // keep the h1 and breadcrumb in step with the settings
        if (meta) {
          const h1 = main.querySelector("h1");
          if (h1 && meta.changed) h1.textContent = meta.title;
          const crumb = main.querySelector(".breadcrumb");
          if (crumb && meta.changed) crumb.innerHTML = crumb.innerHTML.replace(/(›\s*)[^<]*$/, `$1${esc(meta.category)}`);
        }
        say("Saving page…");
        const fresh = await getFile(editPath);
        if (fresh.sha !== source.sha) throw new Error("This page was changed somewhere else since you opened the editor. Copy your text, reload, and try again.");
        let html = source.text.replace(/(<main[^>]*>)[\s\S]*?(<\/main>)/, (m, a, b) => a + cleanContent(main) + b);
        if (meta) {
          html = html.replace(/<title>[\s\S]*?(·[^<]*)?<\/title>/, (m, suffix) => `<title>${esc(meta.title)}${suffix ? " " + suffix.trim() : ""}</title>`);
          const marking = meta.marking ? ` data-marking="${esc(meta.marking)}"` : "";
          html = html.replace(/<body[^>]*>/, `<body data-root="${esc(root)}" data-era="${meta.era}" data-class="${meta.class}"${marking}>`);
        }
        await putFile(editPath, html, `Edit page: ${meta ? meta.title : editPath}`, source.sha);
        if (meta && meta.changed) {
          say("Updating page list…");
          const reg = await getFile("assets/pages.js");
          const f = { title: meta.title, summary: meta.summary, category: meta.category, cls: meta.class,
            format: meta.era, updated: meta.updated, hidden: meta.hidden };
          await putFile("assets/pages.js", updateRegistryEntry(reg.text, editPath, registryEntry(f, editPath), meta.category), `Update page settings: ${meta.title}`, reg.sha);
        }
        dirty = false;
        say("Saved ✓ Live in a minute or two (Ctrl+F5 if it doesn't show)");
        source = await getFile(editPath);
        if (meta) meta.changed = false;
      } catch (err) {
        say(err.message, true);
      } finally {
        saving = false; saveBtn.disabled = false;
      }
    }
    saveBtn.addEventListener("click", save);
  }

  window.WIKI_ADMIN = { openAddPage, openEditor };
})();
