# Project Caelum Wiki — AEROCOM Records Archive

The wiki for **Project Caelum**, a combat space simulator set in an alternate timeline where the space race accelerated. It's presented as the internal records system of the **United States Aerospace Command (AEROCOM)**.

Live: https://quinmatt1111-art.github.io/projectcaelum-wiki/ · Offline: open `index.html` in a browser.

## Eras
Older records still look like the system they were written on. Each page picks one with `data-era` on its `<body>`:

| `data-era` | Looks like |
|---|---|
| `terminal` | 1970s green-screen mainframe |
| `terminal80` | 1980s amber terminal with boxed menus and function keys |
| `web90` | 1990s first web server |
| `portal` | 2000s intranet portal |
| `modern` | Current system |

## Classification
Set with `data-class` on `<body>`: `U`, `CUI`, `C`, `S`, `TS` or `SCI`. Banners appear at the top and bottom of the page in the standard colors. For custom banner text, add `data-marking="SECRET//NOFORN"`.

Inside a page:
- `<p data-pm="S">…</p>` shows a paragraph marking like **(S)**
- `<span class="redact">…</span>` blacks out text
- `<div class="notice">…</div>` is a warning box

## Adding a page
1. Copy one of the `pages/_template-*.html` files for the era you want and rename it, e.g. `pages/vostok-fighter.html`.
2. Fill in the title and content, and set `data-era` / `data-class` on `<body>`.
3. Add a line for it in `assets/pages.js` (same era and class).
4. For a new category, add it to `CATEGORIES` in the same file.

The sidebar, search, Random link and the Main Page directory update automatically.

## Files
| Path | What's there |
|---|---|
| `index.html` | Main Page (records directory) |
| `pages/` | All records |
| `assets/style.css` | All four era styles |
| `assets/pages.js` | List of every page |
| `assets/wiki.js` | Builds banners, headers, menus and search. Agency name and era labels are at the top |
| `images/` | Pictures |

## Authorized mode (design notes)
- Add `hidden: true` to a page in `assets/pages.js` and it disappears from menus, search and the directory. Opening it directly shows **Access Denied**.
- Use the **Authorized access** / Staff Login / Sign In / `[A]` / `F12` link (depends on the era) and enter the code from `ACCESS_CODE` in `assets/pages.js` to see everything. It stays unlocked on that device until you end the session.
- Design notes: copy `pages/_template-note.html`, add it with `category: "Design Notes"` and `hidden: true`.
- **Not real security**: the repo is public, so hidden files can still be read on GitHub.

## Add page button
In authorized mode, use **+ Add page** in the yellow strip. Pick a title, category, format (era or design note), classification and whether it's hidden.
- **With a GitHub token** (saved only in your browser): the page and its `pages.js` entry are created for you. Make a fine-grained token with access to only this repo and **Contents: Read and write**.
- **Without a token**: GitHub opens with the page filled in, and you paste one line into `pages.js`.
New pages are built from the `pages/_template-*.html` files, so editing a template changes what new pages start with.

## Terminal command line
On the 1970s and 1980s terminal pages you can type at the blinking cursor at the bottom (on a computer, just start typing). Commands: a menu number, a record name, `FIND text`, `R` (random), `BACK`, `A` (authorize), `ADD` (new page, authorized only), `CLEAR`, `HELP`.

## Editing a page
In authorized mode, click **✎ Edit this page** in the yellow strip. It opens that page's file in GitHub's editor; change the text and click **Commit changes**. To change a page's title or summary in menus and search, edit its entry in `assets/pages.js`.
