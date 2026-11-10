/*
  PAGE REGISTRY
  -------------
  Every page in the wiki is listed here. The sidebar, the search box,
  the "Random page" link and the category lists on the Main Page are
  all built from this list automatically.

  To add a page:
    1. Copy pages/_template.html, rename it (e.g. pages/vostok-fighter.html)
    2. Add one line below with its title, file path, category and a short summary.

  Categories show up in the order listed in CATEGORIES.
*/

const CATEGORIES = [
  "General",
];

const PAGES = [
  {
    title: "About Project Caelum",
    path: "pages/about.html",
    category: "General",
    summary: "An overview of the game, its setting and this wiki.",
  },
];
