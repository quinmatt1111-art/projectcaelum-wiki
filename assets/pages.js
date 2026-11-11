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
    era       - which system it "lives" on: "terminal", "terminal80", "web90", "portal" or "modern"
    updated   - "last updated" date shown in the directory (any text)
    hidden    - true = only visible in authorized mode (optional)

  Remember: the page's own <body data-class="…" data-era="…"> should match.
*/

/*
  ACCESS CODE for authorized mode. Change it to whatever you like.
  Note: this hides pages from casual visitors only. The repo is public,
  so anyone browsing the files on GitHub can still read hidden pages.
*/
const ACCESS_CODE = "CAELUM";

const CATEGORIES = [
  "General",
  "Design Notes",
  "Templates",
];

const PAGES = [
  {
    title: "Design Notes: Read Me",
    path: "pages/note-readme.html",
    category: "Design Notes",
    summary: "How design notes and authorized mode work.",
    class: "SCI",
    era: "modern",
    updated: "2026-11-10",
    hidden: true,
  },
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
    title: "Template: Design Note",
    path: "pages/_template-note.html",
    category: "Templates",
    hidden: true,
    summary: "Copy this for a new hidden design note.",
    class: "SCI",
    era: "modern",
    updated: "2026-11-10",
  },
  {
    title: "Template: Current System",
    path: "pages/_template-modern.html",
    category: "Templates",
    hidden: true,
    summary: "Copy this for pages on the current, up-to-date system.",
    class: "U",
    era: "modern",
    updated: "2026-11-10",
  },
  {
    title: "Template: 2000s Portal",
    path: "pages/_template-portal.html",
    category: "Templates",
    hidden: true,
    summary: "Copy this for pages last updated in the 2000s intranet portal.",
    class: "CUI",
    era: "portal",
    updated: "2006-08-22",
  },
  {
    title: "Template: 1990s Web",
    path: "pages/_template-web90.html",
    category: "Templates",
    hidden: true,
    summary: "Copy this for pages left over from the first 1990s web server.",
    class: "C",
    era: "web90",
    updated: "1997-03-14",
  },
  {
    title: "Template: 1980s Terminal",
    path: "pages/_template-terminal80.html",
    category: "Templates",
    hidden: true,
    summary: "Copy this for records on the upgraded 1980s amber-screen system.",
    class: "TS",
    era: "terminal80",
    updated: "1987-06-19",
  },
  {
    title: "Template: 1970s Terminal",
    path: "pages/_template-terminal.html",
    category: "Templates",
    hidden: true,
    summary: "Copy this for records still sitting on the original mainframe.",
    class: "S",
    era: "terminal",
    updated: "1979-11-02",
  },
  {
    title: "Project Mithras",
    path: "pages/project-mithras.html",
    category: "General",
    summary: "Project Mithras",
    class: "SCI",
    era: "web90",
    updated: "1997-03-14",
  },
];
