# Project Caelum Wiki

The offline wiki for **Project Caelum**, a combat space simulator set in an alternate timeline where the space race accelerated.

## Viewing it
- **On PC:** open `index.html` in your browser. Everything works offline.
- **Anywhere:** once GitHub Pages is on, use the Pages link.

## Adding a page
1. Copy `pages/_template.html` and rename it, e.g. `pages/vostok-fighter.html`.
2. Fill in the title, category and content.
3. Add a line for it in `assets/pages.js`:
   ```js
   { title: "Vostok Fighter", path: "pages/vostok-fighter.html", category: "Ships", summary: "Short description." },
   ```
4. If it's a new category, add the category name to `CATEGORIES` in the same file.

The sidebar, search, Random page and Main Page lists update automatically.

## Folders
| Path | What's there |
|---|---|
| `index.html` | Main Page (the hub) |
| `pages/` | All wiki articles |
| `assets/style.css` | The theme. Change the colors at the top to restyle everything |
| `assets/pages.js` | List of every page |
| `assets/wiki.js` | Builds the header, sidebar and search |
| `images/` | Put pictures here |
