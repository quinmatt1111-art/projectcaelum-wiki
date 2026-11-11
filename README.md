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
