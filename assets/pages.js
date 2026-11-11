/*
  PAGE REGISTRY
  -------------
  Every page in the wiki is listed here. The sidebar, search, Random
  page link and the directory on the Main Page are all built from it.

  Fields:
    title     - page name
    path      - file location, e.g. "pages/vostok-fighter.html"
    category  - which directory it belongs to (must be in CATEGORIES)
    summary   - one line, shown in search and the directory
    class     - classification: "U", "CUI", "C", "S", "TS" or "SCI"
    era       - which system it "lives" on: "terminal", "web90", "portal" or "modern"
    updated   - "last updated" date shown in the directory (any text)

  Remember: the page's own <body data-class="…" data-era="…"> should match.
*/

const CATEGORIES = [
  "General",
  "Templates",
];

const PAGES = [
  {
    title: "About This Archive",
    path: "pages/about.html",
    category: "General",
    summary: "What Project Caelum is and how this archive works.",
    class: "U",
    era: "modern",
    updated: "2026-11-10",
  },
  {
    title: "Template: Current System",
    path: "pages/_template-modern.html",
    category: "Templates",
    summary: "Copy this for pages on the current, up-to-date system.",
    class: "U",
    era: "modern",
    updated: "2026-11-10",
  },
  {
    title: "Template: 2000s Portal",
    path: "pages/_template-portal.html",
    category: "Templates",
    summary: "Copy this for pages last updated in the 2000s intranet portal.",
    class: "CUI",
    era: "portal",
    updated: "2006-08-22",
  },
  {
    title: "Template: 1990s Web",
    path: "pages/_template-web90.html",
    category: "Templates",
    summary: "Copy this for pages left over from the first 1990s web server.",
    class: "C",
    era: "web90",
    updated: "1997-03-14",
  },
  {
    title: "Template: 1970s Terminal",
    path: "pages/_template-terminal.html",
    category: "Templates",
    summary: "Copy this for records still sitting on the original mainframe.",
    class: "S",
    era: "terminal",
    updated: "1979-11-02",
  },
];
