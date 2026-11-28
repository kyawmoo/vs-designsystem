# HISTORY.md — Session Log

A running, dated log of what Claude Code sessions have done on this repo — not rules, but a record of
what happened, so a new session can catch up from this file plus `git log`. New entries go at the
**top** (most recent first). Keep each short: what was asked, what changed, what is still open.

---

## 2026-11-28 - Docs deployed (`main` `2d29dc4`): Animation & Effects > Live Dot page

- Deployed by Master KMO on the VPS (hostname `vectorsticker`, user `deploy`), the same one command as the `84a3574` docs deploy (`set -e` subshell, shallow clone, backup, `rsync -rt` of `docs/` excluding `CI_COST_RULES.md`, `chown`). Output: `commit: 2d29dc4`, backup `/var/www/ds.vectorsticker.com.bak-20261128-034745`, `/`, `/animation/live-dot.html`, `/animation/text-effects.html`, `/components/line-chart.html` all `200`, `/CI_COST_RULES.md` `404`, `menu entry: 1`, `live-dot css: 1`. Only `/var/www/ds.vectorsticker.com` was touched.
- Rollback: `sudo rsync -a /var/www/ds.vectorsticker.com.bak-20261128-034745/ /var/www/ds.vectorsticker.com/`.
- Not verified: the page in a browser on the live site (this session cannot reach it).

---

## 2026-11-28 - SummaryCardCarousel added (moved from the reports dashboard), for kyawmoo/Report-VectorSticker#73; branch claude/jolly-rubin-rpz0bd; not merged

- Asked: Master KMO: "B" = do reports ticket #73 (move `SummaryCardCarousel` into the package, document it, then switch the dashboard over).
- Changed: new `SummaryCardCarousel` (`react/src/components/SummaryCardCarousel.tsx`, exported from `index.ts`): same layout as the dashboard's local copy: grid from 768px (2 columns, 4 from 1024px, 5 from 1280px when there are exactly five cards, gap 1rem), under 768px one swipeable row with 88% wide cards and a dot per card. Built on `SwipeCarousel`, which gets one optional prop, `mobileClassName` (default `'sm:hidden'`, so every existing use is unchanged): the swipe row must hide where the grid appears (768px here). Docs page `docs/components/summary-card-carousel.html` + sidebar entry in `docs/assets/shell.js`. 11 new tests (`SummaryCardCarousel.test.tsx`, `SwipeCarousel.test.tsx`).
- Differences from the local copy, all in the phone swipe row: dots are buttons that scroll to their card (were plain marks), 20 px / 8 px (were 16 px / 6 px), the active dot is `--vs-color-brand-primary` (was the dashboard's old teal `--vs-color-brand`). The dashboard hides that row at every call site (`hidden md:block`), so the grid it shows is unchanged.
- Checked: `vitest run` 31 files, 452 tests pass; the 2 tests that need `mobileClassName` fail without it; `tsc --noEmit` exit 0; `check:tokens` OK; docs page in Chromium at 1440 / 390 px (no JS error, no sideways scroll, sidebar entry present).
- Open: the component with the real Tailwind build is checked in the dashboard after this is merged (the dashboard's Tailwind scans `react/src`); `SwipeCarousel` still relies on the site's `no-scrollbar` utility and has a raw `#d1d5db` for the inactive dot (not changed here). Docs site not deployed.

---

## 2026-11-27 - LiveDot: the chart's live dot as its own component (React `LiveDot`, Blade `<x-vs-live-dot>`) and an Animation & Effects page; merged as `2d29dc4` (#128)

- Asked: Master KMO: the ripple in the Animation section, usable on its own, not only in charts; chose 1a (name `LiveDot` / `x-vs-live-dot`) and 2a (React and Blade).
- Changed: CSS: the live-dot rules became the `vs-live-dot` block (start/end markers), identical in `react/src/styles.css` and `blade/components.css` (+ docs copy); new `--inline` (in the text flow, no fade-in), `--lg` (12px, 4x), `--still` (no ripple); default colour `--vs-color-brand-primary` when none is set; the chart look is unchanged. `check-tokens.mjs` (new check 9): the two copies must match, every `--vs-*` token read must exist, reduced motion must stop the ripple. New `react/src/components/LiveDot.tsx` (`color`, `size` sm/md/lg, `ripple`, `label` -> `role="img"` + name, else `aria-hidden`; other props passed on), exported from `index.ts`. New `blade/components/vs-live-dot.blade.php` (same props; `color` only `var(--vs-...)` or hex, anything else ignored; `style` merged after the colour). New `docs/animation/live-dot.html` (sizes, colours, avatar / text examples, usage, props) and its menu entry; `blade/README.md` section.
- Checked: `vitest run` 30 files, 445 pass (4 new); `tsc --noEmit` exit 0; `check:tokens` OK. Blade rendered with a real Laravel view engine (illuminate/view 10, scratch dir): default, sm + no ripple + token colour + label + class/id, lg + hex + caller `style` (first run showed the two styles joined without `;`: fixed), a CSS-injection colour and `" onclick=` both dropped, `<b>` in the label escaped. Docs page in Chromium (local static server) at 1280 / 390 px and with reduced motion: menu entry, 10 dots with the right sizes and colours, ripple running (`none` with reduced motion), no sideways scroll, no page errors.
- Not verified: Safari / Firefox; the Blade component on the main site (not copied there). (Drift check provoked: changing one value in the Blade copy fails `check:tokens` with "the vs-live-dot block differs".)
- Open: docs site deploy; reports site may use `LiveDot` after the next package bump (nothing there needs it now).

---

## 2026-11-27 - Docs deployed (`main` `84a3574`): live dot rows on LineChart / BarChart, Date Range Selector phone pills

- Deployed by Master KMO on the VPS (ssh as `deploy`, hostname `vectorsticker`), one command in a `set -e` subshell: shallow clone of `main` over HTTPS, backup `/var/www/ds.vectorsticker.com.bak-20261127-180922`, `rsync -rt` of `docs/` with `--exclude 'CI_COST_RULES.md'` (internal rules stay off the docs site; no `--delete`), `chown -R www-data:www-data`, temp dir removed. Output: `commit: 84a3574`, `/`, `/components/line-chart.html`, `/components/bar-chart.html`, `/components/date-range-selector.html` all `200`, `/CI_COST_RULES.md` `404`, `liveDot rows: 1`. `sudo` asked for the password three times (two typos). Only `/var/www/ds.vectorsticker.com` was touched; no Apache or pm2 restart.
- Rollback: `sudo rsync -a /var/www/ds.vectorsticker.com.bak-20261127-180922/ /var/www/ds.vectorsticker.com/`.
- Not verified: the pages in a browser (this session's network cannot reach the site).

---

## 2026-11-27 - LineChart / BarChart: live dot with a soft ripple on the newest reading of every line (`liveDot`, default on); merged as `84a3574` (#127)

- Asked: Master KMO: the live dot of the reports site's Site Monitor CPU line on every line graph, sparklines included; chose 1a (build it in the design system), 2a (every line that ends at today/now), 3a (smaller on sparklines).
- Changed: new `react/src/components/liveDot.ts` (`newestIndex`, `liveDotPlugin`: an HTML dot placed over the canvas on the point's final position after every draw; hidden when the point is missing or outside the plot). `LineChart` and `BarChart` get `liveDot` (default `true`): one dot per line series on the newest value up to today, in the series colour, replacing the hollow today point; sparklines get `--sm`; BarChart bars get none; `lineStyle="markers"` keeps the large dark today dot and its halo becomes the ripple (`--ring`, `--vs-chart-today-marker` colour); a dot fades in once the line has drawn up to it. `styles.css`: `.vs-live-dot` (8px, ripple to 5.5x, 50% to 0, 2.4s; `--sm` 5px / 3.5x; `--ring` 20px / 2.6x), no ripple with reduced motion. Docs: rule and prop rows on the LineChart and BarChart pages (static demos not animated).
- Checked: `vitest run` 29 files, 441 tests pass (7 new; 3 old expectations changed for the added plugin; the markers halo test now runs with `liveDot={false}`); turning the default off fails 10 tests, drawing the halo with the ring fails the ring test; `tsc --noEmit` exit 0; `check:tokens` OK. In the reports site with this source copied in: its lint, 1011 tests and Chromium at 960 px on fixture data: dot on a SummaryCard sparkline (5px), area LineChart, Revenue-style bar + line, the desktop Visitors markers chart (ring), Site Monitor; ripple running, `none` with reduced motion; no page errors.
- Open: reports site: bump the package and drop its own `.vs-live-dot` CSS (done on its branch, waiting for this merge). Docs site not deployed.
- Not verified: Safari / Firefox; touch; real data.

---

## 2026-11-27 - DateRangeSelector: opt-in phone pills (`phoneLayout="pills"`), for kyawmoo/Report-VectorSticker#366; branch claude/jolly-rubin-rpz0bd; not merged

- Asked: Master KMO: do kyawmoo/Report-VectorSticker#366 (the ticket sits in the reports repo; the change is this component).
- Changed: `DateRangeSelector` gets `phoneLayout` (`'button'` default, unchanged; `'pills'`): under 768px every option is a round pill in a sideways-scrolling row, the selected one dark (`--vs-color-brand-secondary`, `aria-pressed="true"`); with `allowCustom` a Custom pill opens the same RangeCalendar bottom sheet (Apply calls `onCustomChange`, then `onChange('custom')`); no trigger and no FilterSheet in that mode. Desktop unchanged. Styles `.vs-date-range__pills` / `__pill` in `react/src/styles.css` (tokens only; the look of the reports site's approved phone pills). Docs page: new "On a phone: pills" section, usage line, `phoneLayout` prop row. 8 new tests.
- Checked: `vitest run` 29 files, 434 tests pass; the 6 pills tests fail with the old component; `tsc --noEmit` exit 0; `check:tokens` OK. Chromium with the real component: 320 / 390 px no sideways page scroll, the pill row scrolls inside itself, tapping 90D presses only 90D, Custom opens the bottom sheet; 1024 px pills hidden, desktop buttons shown; no page errors.
- Open: the reports site uses it on Server Health after this is merged (package bump + `phoneLayout="pills"`). Docs site not deployed.

---

## 2026-11-27 - CI cost rules: money amounts and other repository names removed (public repo); branch claude/gracious-gauss-hwjdhk; not merged

- Asked: Master KMO: keep the repo public, remove the amounts and repo names from `docs/CI_COST_RULES.md`.
- Changed: `docs/CI_COST_RULES.md` only: the list of the other repositories, the November usage per repository, the included-compute amount and the budget amounts are gone; the rules themselves are unchanged. A line says this public copy leaves them out, so it now differs from the copies in the private repositories.
- Not changed: the text stays in git history (#123) and anywhere it was copied while public; the repo stays public. Docs site not deployed (with `CI_COST_RULES.md` excluded, nothing in `docs/` changed since `c17a28e`).

---

## 2026-11-27 - CI cost rules added (docs only); branch claude/gracious-gauss-hwjdhk; not merged

- Asked: Master KMO: add the shared CI cost rules (the same text in every repository of the account). Tier A, docs only.
- Changed: new `docs/CI_COST_RULES.md` (the exact text given); a short "CI Cost Rules" section at the end of `CLAUDE.md` pointing to it; this entry. No workflow, code or config changed; no CI re-run or workflow_dispatch.
- Note: `docs/` is what the deploy copies (`rsync -rt docs/`), so the next docs deploy will also put `CI_COST_RULES.md` on ds.vectorsticker.com. The repo is public, so the text is already public on GitHub.
- Open: PR not opened (Master KMO to decide).

---

## 2026-11-26 - Docs: fourth deploy of the day (`main` `c17a28e`, PR #121 added): every page reads as titled cards

- Asked: Master KMO: do all the pages, no questions.
- Merged by Claude: #121 (squash) after its CI was green on the head `44b0bd6` (5 of 5) and `mergeable_state` was clean.
- Deployed by Master KMO on the VPS (ssh as `deploy` with `~/.ssh/vectorsticker_ed25519`, hostname check `vectorsticker`), the same one command as the earlier deploys. Output shown: `commit: c17a28e Docs: every remaining section becomes a titled card (#121)`, backup `/var/www/ds.vectorsticker.com.bak-20261126-105945`, `/`, `/components/button.html`, `/components/table.html`, `/components/alert.html`, `/components/checkbox.html`, `/foundations/colors.html`, `/animation/text-effects.html` all `200`, `all-sections cards in live shell.js: 6`. Only `/var/www/ds.vectorsticker.com` was touched.
- Rollback: `sudo rsync -a /var/www/ds.vectorsticker.com.bak-20261126-105945/ /var/www/ds.vectorsticker.com/`.
- Not verified: the live pages in a browser by Claude (this session cannot reach ds.vectorsticker.com); 43 of the 46 pages by eye in the local run (only Table, Alert, Checkbox, Card, Avatar, Meter, Colors, Tabs, Badge, Button were looked at); charts (Chart.js from a CDN did not draw in the sandbox).

---

## 2026-11-26 - Docs: every remaining section becomes a titled card, so all pages read as cards (shell.js); branch claude/all-sections-cards; not merged

- Asked: Master KMO: do all the pages, no questions.
- Changed (docs shell only, no page HTML): `docs/assets/shell.js`: after the earlier steps, every section still left (a title with several demos) becomes one `article.vs-docs-card` with the title as a small card title and the demos inside; the section id moves to the card; a title with nothing visual under it is removed and leaves a hidden anchor with its id; code blocks that sat under such a title go to the drawer under that title (data-vs-drawer). `docs/assets/shell.css`: card spacing, no margin under the last demo of a card.
- Checked: Chromium (Playwright, files served from `docs/`) on all 46 pages at 1440 and 390px: no JS error, no sideways scroll; every `id` written in the source of every page still exists (Text Effects: `title-wipe`, `number-count-up`, `adding-an-effect`); Table, Alert, Checkbox looked at full page (stacked titled cards, no stray big titles).
- Not verified: the other pages by eye; WebKit and Firefox locally (CI runs `reveal-check`); the live site (needs a deploy). Charts (Chart.js from a CDN) did not draw in the sandbox.

---

## 2026-11-26 - Docs: third deploy of the day (`main` `57f8ffc`, PR #119 added)

- Asked: Master KMO: merge and deploy the titled-cards change (runs of one-demo sections become a grid of titled cards).
- Merged by Claude: #119 (squash) after its CI was green on the head `8ba717a` (5 of 5) and a merge conflict in `HISTORY.md` with #118 was fixed by merging `main` into the branch.
- Deployed by Master KMO on the VPS (ssh as `deploy` with `~/.ssh/vectorsticker_ed25519`, hostname check `vectorsticker`), the same one command as the earlier deploys. Output shown: `commit: 57f8ffc Docs: runs of one-demo sections become a grid of titled cards (#119)`, backup `/var/www/ds.vectorsticker.com.bak-20261126-103225`, `/`, `/components/button.html`, `/components/avatar.html`, `/components/meter.html`, `/components/tabs.html`, `/animation/text-effects.html` all `200`, `titled cards in live shell.js: 2`. Only `/var/www/ds.vectorsticker.com` was touched.
- Rollback: `sudo rsync -a /var/www/ds.vectorsticker.com.bak-20261126-103225/ /var/www/ds.vectorsticker.com/`.
- Not verified: the live pages in a browser by Claude (this session cannot reach ds.vectorsticker.com); the affected pages other than Avatar and Meter by eye. Pages with several demos in one section are still in their old layout (a hand-built layout, as Button and Badge, is needed).

---

## 2026-11-26 - Docs: runs of sections that each hold one demo become a grid of titled cards (shell.js); branch claude/simple-sections-cards; not merged

- Asked: Master KMO: "proceed" (continue the new card layout on the other pages).
- Changed (docs shell only): `docs/assets/shell.js`: two or more sections in a row that each hold just one `.vs-docs-preview` box become one `.vs-docs-cards` grid; the section title is the card title (small), the section id moves to the card. A lone such section stays a title with its box. `docs/assets/shell.css`: the box inside a card has no border or padding of its own (no box inside a box). In the local run this applies to Avatar, Breakdown List, Date Range Selector, Donut Chart, Empty State, Meter, Navigation (2 runs), Popover and Rank Pill, and also joins Bar Chart, Line Chart and Tabs.
- Checked: Chromium (Playwright, files served from `docs/`) on all 46 pages at 1440 and 390px: no JS error, no sideways scroll; every `id` written in the source of every page still exists; Avatar and Meter looked at (three equal cards each).
- Not verified: the other pages in this list by eye; WebKit and Firefox; the live site (needs another deploy). Pages with several demos per section, or demos in their own grids and tables, are unchanged (hand-built layout still needed, as Button and Badge).

---

## 2026-11-26 - Docs: second deploy of the day (`main` `e6568d7`, PRs #116 and #117 added)

- Asked: Master KMO: merge the open docs PRs and tell him to deploy.
- Merged by Claude (merge commits, in order): #111 shell, #112 Button page, #113 Badge page, #114 every page through the shell, #115 reference sections to the drawer; #116 (deploy record) and #117 (equal demo cards) by squash. CI was green on each head before its merge. #106 and #102 are older open PRs, not part of this work, not touched.
- Deployed by Master KMO on the VPS (ssh as `deploy` with `~/.ssh/vectorsticker_ed25519`, hostname check `vectorsticker`), the same one command as the first deploy of the day. Output shown: `commit: e6568d7 Docs: group consecutive demo boxes into equal cards (#117)`, backup `/var/www/ds.vectorsticker.com.bak-20261126-085450`, `/`, `/components/button.html`, `/components/badge.html`, `/components/tabs.html`, `/animation/text-effects.html` all `200`, `grouping in live shell.js: 1`. Only `/var/www/ds.vectorsticker.com` was touched.
- Rollback: `sudo rsync -a /var/www/ds.vectorsticker.com.bak-20261126-085450/ /var/www/ds.vectorsticker.com/`.
- Not verified: the live pages in a browser by Claude (this session cannot reach ds.vectorsticker.com); Chart.js charts on the live Bar and Line Chart pages.

---

## 2026-11-26 - Docs: two or more demo boxes in a row become equal cards side by side (shell.js); branch claude/group-demos; not merged

- Asked: Master KMO: the layout is good; continue with the other pages.
- Changed (docs shell only): `docs/assets/shell.js` groups consecutive `.vs-docs-preview`, `.demo-browser` and `.demo-redline` boxes (two or more) into a `.vs-docs-cards.is-wide` grid; a lone box and demos that already sit in their own grid or table stay as they were. `docs/assets/shell.css`: no margin and `min-width: 0` for those boxes inside the grid. In the local run only Bar Chart, Line Chart and Tabs have such a run.
- Checked: Chromium (Playwright, files served from `docs/`) on all 46 pages at 1440 and 390px: no JS error, no sideways scroll; every `id` in the source of every page still exists; Bar Chart looked at (two cards side by side; the charts themselves did not draw in the sandbox because Chart.js comes from a CDN it cannot reach).
- Not verified: Line Chart and Tabs by eye; WebKit and Firefox; the live site.
- Open: most other pages have one demo per section or demos in their own grids, so a hand-built card layout (as Button and Badge) is still needed to make them look the same.

---

## 2026-11-26 - Docs: the new white layout deployed (PRs #111 to #115, `main` `166b3d7`)

- Asked: Master KMO: deploy the new docs layout (shell, Button and Badge pages, the tidy-up of all pages, reference sections in the Code drawer).
- Deployed by Master KMO on the VPS (ssh as `deploy`, hostname check `vectorsticker`), one command under `set -e`: shallow clone of `main` over HTTPS, check that the new `shell.js` has the drawer code, backup `/var/www/ds.vectorsticker.com.bak-20261126-080953`, `rsync -rt docs/` into `/var/www/ds.vectorsticker.com` (no `--delete`), `chown -R www-data:www-data`, temp dir removed. Output shown: `commit: 166b3d7 Merge pull request #115`, `/`, `/components/button.html`, `/components/badge.html` and `/animation/text-effects.html` all `200`, `drawer in live shell.js: 4`. Only `/var/www/ds.vectorsticker.com` was touched; no Apache or pm2 restart, main site and reports site not touched.
- Rollback: `sudo rsync -a /var/www/ds.vectorsticker.com.bak-20261126-080953/ /var/www/ds.vectorsticker.com/`.
- Not verified: the live pages in a browser (this session cannot reach ds.vectorsticker.com); the 41 pages other than Button and Badge on the live site; their demos are still in their old layout (not regrouped into equal cards).

---

## 2026-11-26 - Docs: reference sections (props, measurements, anatomy, accessibility, tokens, usage, Blade) also go to the Code drawer; branch claude/card-tabs-table (on top of claude/all-pages); not merged

- Asked: Master KMO: proceed with Card, Tabs and Table. They are large pages with many live demos, so instead of rewriting each by hand the generic tidy-up in `shell.js` now also sends a whole section to the drawer when its title starts with props, measurement, anatomy, redline, spec, token, design token, accessib, keyboard, usage -, rollout, api, blade or governance (demos included).
- Checked: Chromium (Playwright, files served from `docs/`) on all 46 pages at 1440 and 390px: no JS error, no sideways scroll; every `id` written in the source of every page still exists; Card, Table and Tabs looked at (full page).
- Not verified: the demos of Card, Tabs and Table are still in their old layout (not regrouped into equal cards by hand); WebKit and Firefox; `reveal-check` (CI runs it); the live site.

---

## 2026-11-26 - Docs: every page follows the new layout through the shell (text, notes and spec tables move to the Code drawer); branch claude/all-pages (on top of claude/badge-page); not merged

- Asked: Master KMO: do all the pages one after another, as fast as possible, no approval questions.
- Changed (docs shell only, no page HTML): `docs/assets/shell.js` tidies a page that is not already written in `<section>`s: a section head becomes a plain title; the paragraphs, lists, callouts, spec tables (tables without demos) and section notes of each section move to the Code drawer under the section's title (with the code blocks); sections left with nothing are dropped; the demos stay. `docs/assets/shell.css`: previews are white cards (18px radius), the drawer's text padding, and on phones wide demos and tables scroll inside themselves. A short line under a title is not added by the script; add `.vs-docs-lead` by hand where it is needed.
- Checked: Chromium (Playwright, files served from `docs/`) on all 46 pages at 1440 and 390px: no JS error, no sideways scroll, no paragraph, list, callout or code block left directly in the page, every page has a Code drawer; samples looked at: card, tabs, colors; `npm run check:tokens` OK.
- CI found a break: `reveal-check` (all three browsers) needs the ids `title-wipe`, `number-count-up`, `adding-an-effect` on the Text Effects page, and the tidy-up had dropped the "Adding an effect" heading (all its content went to the drawer). Fixed: a dropped heading leaves its id behind (a hidden anchor), and a section head's own id moves to its title. Checked in Chromium: the three ids exist, and every `id` written in the source of all 46 pages still exists after the script runs.
- Not verified: every page by eye (only card, tabs, colors, badge, button looked at); WebKit and Firefox; the live site. Pages that keep text inside their own demo blocks keep it. Button and Badge are hand-built; the other pages use the generic tidy-up, so their demos are not yet grouped into equal cards.

---

## 2026-11-26 - Docs: Badge page in the new card layout; branch claude/badge-page (on top of claude/button-page); not merged

- Asked: Master KMO: continue the new design with Badge, Card and Tabs (Badge first).
- Changed (docs only): `docs/components/badge.html`: one section "Tones" with four equal cards (Semantic, Product, Item status, Dot); the notes, usage (React, Blade) and props are in the Code drawer (`data-vs-drawer`). Same badges and colours as before.
- Checked: Chromium (Playwright, files served from `docs/`) at 1440 and 390px: no code block left in the page, 5 drawer cards, no JS error, no sideways scroll; `npm run check:tokens` OK.
- Not verified: WebKit and Firefox; the live site.

---

## 2026-11-26 - Docs: Button page in the new card layout; branch claude/button-page (on top of claude/new-docs-shell); not merged

- Asked: Master KMO: rewrite the Button page in the new design (sections of equal cards, code hidden in the Code drawer).
- Changed (docs only): `docs/components/button.html` rebuilt from its own content: sections Emphasis (Primary, Secondary, Tertiary, Accent: sizes + Default / Hover / Pressed / Disabled), Formats (icon only, icon + text, text only), Special (social, Google, support), In context, Do and don't; the usage code, props, spec table (redlines), audit and copy buttons are in the Code drawer through `data-vs-drawer="Title"` (new in `shell.js`; any block can use it). `shell.css`: generic card grid (`.vs-docs-cards`, `.vs-docs-card`, `.is-quad` = 2 x 2, or 4 across from 1700px), optional one line under a section title (`.vs-docs-lead`), section spacing.
- Checked: Chromium (Playwright, files served from `docs/`) at 1440, 1920 and 390px: no code block left in the page, 7 drawer cards, no JS error, no sideways scroll.
- Not verified: Font Awesome icons (the sandbox cannot load the CDN, icons showed empty); WebKit and Firefox; the old matrix (all sizes x states of every variant) is now sizes + states per card, not one table; the live site.

---

## 2026-11-26 - Docs: new white shell for the whole site (sidebar, top bar, fluid body, Code drawer); branch claude/new-docs-shell; not merged

- Asked: Master KMO: the docs look boring; white page, side menu + fluid body (side padding in %, no fixed width), big centred title, less text, design first, the code hidden in one big obvious place; no numbers or circles; "start implementing the whole ds site".
- Changed (docs shell only, no component code, no page HTML): `docs/assets/shell.css` (white sidebar, top bar, centred title, body padding 5% with at least 16px, section titles 24 to 32px, wide tables scroll on phones, Code drawer styles) and `docs/assets/shell.js` (adds the top bar with breadcrumb + menu search, and moves every `.vs-docs-code-block` and the page lede into a "Code" drawer opened by the big button at the bottom right; one card open at a time; without the script the page stays as before). All 45 pages get it through the shared files.
- Checked: `npm run check:tokens` OK; Chromium (Playwright, files served from `docs/`) on badge, button, tabs, text-effects, colors and the index at 1440px and 390px: the top bar, title and Code button show, no code block is left in the page, no JS error, no sideways scroll except text-effects at 390px (a table, fixed after).
- Not verified: WebKit and Firefox; `npm run test:browser`; the other 39 pages one by one; the live site (Master KMO deploys the docs); a screen reader.

---

## 2026-11-26 - Docs: third menu section "Animation & Effects" (Reveal, Rewind Reveal, Text Effects moved there); merged (#109, `26b2bfa`); docs deployed

- Asked: Master KMO: the docs have three sections, Foundations, Components and Animation & Effects; every animation and effect goes in the last one. Decision (b): the pages move too, not only the menu.
- Changed (docs and checks only, no component code): `docs/components/{reveal,rewind-reveal,text-effects}.html` moved to `docs/animation/` (git mv); the menu (`docs/assets/shell.js`) has the new group after Components; the eyebrow of the three pages says "Animation & Effects"; links updated in `docs/components/line-chart.html`, `docs/animation/reveal.html`, `docs/animation/text-effects.html`, `react/browser/reveal-check.mjs`, `.github/workflows/reveal-browser-check.yml`, `blade/README.md`. The demo files stay in `docs/assets/`. Older HISTORY lines keep the old paths (they are a record).
- Checked: `npm run test:browser -- --browsers=chromium` all pass (it opens the moved pages and checks the menu entries); `check-tokens` OK; Chromium on the local docs: the three pages answer 200 at `/animation/...` with "Animation & Effects" open and the page marked, Components pages open Components, the old `/components/...` addresses answer 404, no page errors.
- Deploy note: the docs deploy is `rsync` without `--delete`, so the old three files stay on the server until they are removed by hand. Not verified: WebKit and Firefox locally (CI runs them); the live docs site (not deployed).
- CI on #109 and on `main` `26b2bfa`: `design-system-checks` and `reveal-browser-check` (chromium, webkit, firefox) all success (looked at after the merge).
- Docs deployed by Master KMO on the VPS (hostname check `vectorsticker`, user `deploy`), one command under `set -e`: shallow clone of `main` over HTTPS to a temp dir, backup `/var/www/ds.vectorsticker.com.bak-<date-time>`, `rsync -rt docs/` into `/var/www/ds.vectorsticker.com`, the three old files `components/{reveal,rewind-reveal,text-effects}.html` removed, `chown -R www-data:www-data`, temp dir removed. Output: `animation/reveal.html 200`, `animation/rewind-reveal.html 200`, `animation/text-effects.html 200`, `components/reveal.html 404`. This was also the first deploy of the Rewind Reveal page. Only `/var/www/ds.vectorsticker.com` was touched; no Apache or pm2 restart, main site and reports site not touched.
- Not verified: the commit line of the clone (not in the output shown; the `animation/` pages answering 200 exist only from `26b2bfa`); the pages in a browser (this session cannot reach ds.vectorsticker.com).

---

## 2026-11-25 - BarChart soft bars widen on a short range (up to 32px); branch claude/barchart-soft-few-days; not merged

- Asked: Master KMO (Reports live screenshot, 7 days): the downloads bars should be wide when there are only a few days; option (a): half of the column, at most 32px.
- Changed: `barStyle="soft"` on a short range (`BAR_CHART_FEW_DAYS`, 10 slots or fewer including the empty day after today) caps the bars at the new `SOFT_BAR_FEW_DAYS_MAX_WIDTH` 32px instead of 12px; still `barPercentage` 0.5. 11 slots or more keep 12px. This replaces the rule of the entry below ("same for few and many days"). Docs (`bar-chart.html`) updated.
- Checked: `react` 388 tests pass (1 changed, 1 new); reverting the code makes 2 tests fail; `tsc --noEmit` exit 0; `check:tokens` OK. Reports app with this change (local copy, API mocked, Chromium 1440px): 7D bars about 32px wide, 30D unchanged at 12px.
- Not verified: touch devices; real data.

---

## 2026-11-25 - Rewind Reveal: a timeline fills in newest first (CSS + plain script + React); branch claude/rewind-reveal; not merged

- Asked: Master KMO: an effect for a calendar where today appears first and the earlier days follow one after the other, to be used on social.designkmo.com (vanilla JS, no React) and easy to use from the DS. Decision (a): CSS + a small plain script as the base, React on top, a docs page with a demo.
- Added: tokens `--vs-motion-rewind-duration` 360ms and `--vs-motion-rewind-step` 30ms (tokens.css, tokens.json, docs copy); CSS block `vs-rewind` (identical in `react/src/styles.css` and `blade/components.css`, off under reduced motion); `blade/rewind-reveal.js` (`VsRewind.apply / clear / indexByDay`, copy in `docs/assets`); React `RewindItem` and `rewindIndexes` (exported); docs page `components/rewind-reveal.html` with a demo (`assets/rewind-demo.html`) and a sidebar entry. Order: today step 0, earlier days 1, 2, 3 newest first, days after today not animated, steps stop at `maxSteps` (default 18, at most 60).
- Checked: `tsc --noEmit` exit 0; 425 tests (29 files) pass, 38 of them new; 9 mutations of the new code (sort order, future days, cap, today step, negative index, dropped style, no reset) each fail a test; `check-tokens` OK and fails when the two CSS blocks or the script copy differ; Chromium (Playwright) on the demo: today delay 0s, 11 Nov 0.03s, 5 Nov 0.21s, days after today no animation, reduced motion no animation, opacity 0 then 1 over time, no page errors; the docs page opens with its sidebar entry.
- Not verified: WebKit and Firefox; a screen reader; touch; the docs page after a deploy (Master KMO deploys the docs). The 360ms / 30ms times are an Estimate from the frames of a reference recording, not tested with users. Not done here: using it on social.designkmo.com (a separate task, next).

---

## 2026-11-25 - BarChart soft bars stand on the axis, tooltip beside the line point; branch claude/barchart-tooltip-bars; not merged

- Asked: Master KMO, after the Reports deploy (screenshot): the tooltip covered the today dot and line; soft bars should have small bottom corners and a rounder top so they stand; bar width should follow the room but stop at a standard size.
- Changed: `barStyle="soft"` bars take half of the day's column up to `SOFT_BAR_MAX_WIDTH` 12px (same for few and many days), corners top 999 / bottom 5 (`SOFT_BAR_BOTTOM_RADIUS`). `lineStyle="markers"`: tooltip positioner `vsLinePoint` (exported `linePointPosition`) anchors on the line point instead of Chart.js's average of bar top and point; `yAlign: 'center'`, caret 8, caret padding 21 (today halo + 4). Docs updated.
- Checked: 387 tests (3 new), `tsc --noEmit` exit 0, `check:tokens` OK; Reports app (local copy, mocked API, Chromium): tooltip left of the today dot with its arrow, bars standing.
- Not verified: the tooltip on the left half of a chart in a browser (Chart.js puts it on the right there); touch devices.

---

## 2026-11-25 - BarChart dashboard style options (Reports Overview "Visitors & Downloads"); branch claude/barchart-dashboard-style; not merged

- Asked: Master KMO, the Reports Overview chart differs from the design "Overview (desktop, aligned)"; option (a): add the missing options to the DS `BarChart` (not a local chart in the app).
- Added (all opt-in, defaults unchanged): `barStyle` (`soft`), `lineStyle` (`markers`: straight line, a dot and value on every day, large dark today dot with halo), `tooltipTone` (`dark`), `xLabels` (`ends`), `rightAxis` (`hidden`), `legendPosition="bottom-end"`; stylesheet rule `.vs-line-chart-legend--bottom.vs-line-chart-legend--end` gated in `check-tokens`; docs `bar-chart.html`.
- Checked: the 28 existing BarChart tests pass unchanged (default options keys and plugin list); 12 new tests (40 BarChart, 384 in all); 7 mutations of the new code each fail a test; `tsc --noEmit` exit 0; `check:tokens` OK. In the Reports app (local copy of this change, API mocked, Chromium): the chart shows the soft bars, markers, dark today dot, dark tooltip pinned on today and back after the pointer leaves, 3 x labels, no right axis numbers.
- Not verified: touch devices; a screen reader; the docs page in a browser.

---

## 2026-11-23 — Task 8: Reports canvas brand alignment (design file only); not deployed

- Asked: Task 8 of the approved set. Answers: B1a the four desktop boards only, B2b four new "(aligned)" copies beside the originals (originals untouched), B3a flat `#F8F8F8` page with a lavender band behind the title and no pastel corners, B4a radius 16 to 12, 10 to 12, 18 to 20, 3 and 4 to 5, B5a the indigo `#5558B3` and its tints to the site violet family, B6a today marker dark, B7c weight 300 for long descriptive text only.
- Done in the Reports redesign canvas (Design artifact, not a repo): `OverviewDesktopAligned`, `FeedbackDesktopAligned`, `ItemsDesktopAligned` at x 4100 (same y as the originals) and `ItemDetailDesktopAligned` at x 5640, plus note `a1` and `canvas.json`. Generated by one script from the live originals, so the change is repeatable. Violet map: `#5558B3` to `#743CEE`, `#E0E1F9` and `#D6D7F3` to `#E8E5FC`, `#F2F2FC` to `#F3F1FE`, `#AAABD9`, `#9B9EEA`, `#C9CAE8` to `#9E77F3` (downloads bars and swatches `#9E77F3` at 55%); dots, halo and line of today to `#222222`; the mint wash of the Overview board removed too.
- Checked in Chromium (Playwright) on each pair: page background `rgb(248, 248, 248)`; the old violets are gone from the DOM (before: present on all four); every corner radius is now one of 5, 8, 12, 20, 50%, 9999 (before: also 3, 4, 10, 16, 18); weight-300 text nodes 3 / 1 / 3 / 7 (before: 0); board sizes unchanged; no page errors. Contrast computed: violet text on white 5.80, on `#E8E5FC` 4.70, on `#F3F1FE` 5.19, white on violet card 5.80, `#9E77F3` graphic on white 3.29. Published file of one board compared by sha256 with the local copy: equal.
- Not touched: the 15 phone boards, the originals, `Report-VectorSticker` (clean), `VectorSticker.Com`. Tasks 9 and 10 (real Reports integration) are not started and need a new approval.
- Not verified: Master's visual judgement (the pale downloads bars and the light-violet dashed reference line are the places most changed); the mobile boards; the published page in a browser by Master.

---

## 2026-11-23 — Task 7: BarChart dashboard options; not deployed

- Asked: Task 7 of the approved set (6, 7, 8 together). Answers: C1a extend the existing `BarChart` with opt-in props (no new component), C2a three separate props, C3a `BarChart` only (LineChart is not changed), C4a pinned tooltip on the latest day with data and hover replaces it, C5a legend centred at the bottom, C6a this covers issue #14 (Master closes it).
- Step 1 (own commit `3076941`): 4 baseline tests on the unchanged chart (legend above the canvas, dotted orange today line and bold today tick, hover-only tooltip and the exact `options` keys, `showLegend={false}`); they pass unchanged after step 2.
- Step 2: `legendPosition` (`top` default | `bottom`), `pinTooltip` (default false), `todayMarker` (`default` | `dark` = `--vs-chart-today-marker`, already in tokens). Defaults are byte-identical: `options` keys, plugin list and animation object are the same unless a prop is set. Pin plugin: pins after the bars have grown (once; a later animation never overrides a hover), re-pins after the pointer leaves, clears the hover fade first so the tooltip swatches keep the full colour. New stylesheet rules `.vs-line-chart-legend--bottom` gated in `check-tokens`.
- Checked: 28 BarChart tests (was 11); 13 component mutations each fail a test (first run found 2 gaps — a series with no value on the pinned day, a value dated after today — both got a test, then caught); `check:tokens` OK; `tsc --noEmit` exit 0; real component in Chromium: default chart identical, dashboard chart shows legend at the bottom, dark today line, "23 Nov (Today)" tooltip pinned, hover replaces it, leaving brings it back with no faded bars.
- Found, not fixed (separate task, rule 5): in the default `BarChart`, after the pointer leaves the chart the hovered day stays bright and the other days stay faded (seen in Chromium on the unchanged chart). Not touched because default behaviour must not change.
- Not verified: the reports app; touch devices (pinned tooltip on tap); resize while a tooltip is pinned; a screen reader (the tooltip is canvas-drawn); no lint or build script.

---

## 2026-11-23 — Task 6: RankPill, new component; not deployed

- Asked: Master KMO approved Tasks 6, 7 and 8 together ("proceed your suggestions", every recommended answer); each is built and committed on its own. Task 6 answers: R1a `tone` auto (rank 1 lime, others dark) with an override; R2a `shape="pill"` and `"circle"`; R3a inline element, the caller places it; R4a visible "#1 · Top asset", spoken "Rank 1, Top asset", an invalid rank draws nothing; R5 ticket text in the report, no GitHub issue.
- Added: `RankPill.tsx` (`rank`, `label`, `tone`, `shape`; also `isValidRank`), `.vs-rank*` in `styles.css`, `scripts/check-tokens.mjs` gates (3 contrast pairs of the pill, 7 stylesheet rules), docs page `docs/components/rank-pill.html` with a sidebar entry. No new token: the colours are `--vs-color-brand-accent`, `--vs-color-brand-secondary`, `--vs-color-surface`.
- Checked: `check:tokens` OK (182 tokens, 54 raw colours); `tsc --noEmit` exit 0; 7 new tests; 7 component mutations each fail a test; 4 stylesheet mutations each fail `check-tokens`; the real component rendered in Chromium (lime `rgb(188, 253, 29)` with dark text, dark `rgb(34, 34, 34)` with white text, pill 24px high, circle 32px, spoken text 1x1 px).
- Not verified: the reports app (its local `★ TOP ASSET` badge, which still uses the old `#005c55`, is not replaced yet); a screen reader; no lint or build script.

---

## 2026-11-23 — Task 5: DonutChart (issue #72), new component; not deployed

- Asked: Master KMO approved Task 5 with every recommended answer (Q1a plain SVG, no chart library; Q2a six `--vs-chart-donut-*` tokens, each >= 3:1 on white; Q3a built-in legend, below by default, `legend="right"` and `"none"`; Q4a whole percentages, "<1%" under one percent; Q5a an empty ring of the same size with the `empty` text; Q6a CSS draw-in, off under reduced motion; Q7a native hover `<title>`; Q8a no automatic "Other", the palette repeats after six).
- Added: `DonutChart.tsx` (`segments` {key, label, value, color?}, `ariaLabel`, `centerValue`, `centerCaption`, `size`, `formatValue`, `empty`, `legend`; ring `role="img"`, legend and middle are real text; negative / NaN / Infinity count as 0; one segment = whole ring; a small gap between neighbours; each segment sweeps in after the one before). `styles.css`: `.vs-donut*` and `@keyframes vs-donut-draw`, off under `prefers-reduced-motion: reduce`. Tokens (additive, mirrored in `tokens.json`): `--vs-chart-donut-1` to `-6` (brand-secondary, brand-primary-text, badge-free, badge-trending, muted + 30% black, badge-free 70% into white). The track is the Task 4 `--vs-meter-track`. No raw colour added.
- `scripts/check-tokens.mjs`: the colour reader now also mixes a colour with another colour (not only with black); the six donut colours >= 3:1 on white, their values, the draw-in animation, the keyframe start and the reduced-motion rule, the legend and middle text colours. Docs: new page `docs/components/donut-chart.html` and a sidebar entry.
- Checked: `check:tokens` OK (182 tokens, 54 raw colours); `tsc --noEmit` exit 0; `vitest` 295/295 (was 277; 18 new tests: [38, 34, 20, 8], all zero, empty list, negative, NaN, Infinity, tiny, single, 7+ segments, centre, legend, colours, hover text, ARIA); 12 component mutations each fail a test; 8 token/CSS mutations each fail `check-tokens`; the real component bundled with Vite and rendered in Chromium (legend below and right, 7 segments, empty, one segment): animation on with motion, `animation-name: none` with `prefers-reduced-motion: reduce`, no script errors; the docs page renders and is in the sidebar.
- Not verified: the reports app (its `TrafficDonut` stand-in is not replaced yet, Task 9/10); a phone; a screen reader; colour-blind viewing of the black, dark green and slate-blue segments (they are told apart by the gap and the legend text); no lint or build script.
- Open: Task 6 (RankPill) waits for Master KMO's approval.

---

## 2026-11-23 — Task 4: Meter (issue #25) and BreakdownList, new components; not deployed

- Asked: Master KMO approved Task 4 with every recommended answer (Q1a the name `Meter`, as in issue #25, not `ProgressBar`; Q2a the whole of #25 including threshold ticks; Q3a fills darkened so each is >= 3:1 on the track, default fill the dark brand green; Q4a `aria-valuenow` kept inside 0..max, `aria-valuetext` keeps the real reading; Q5a the BreakdownList ticket text is given to Master KMO, no GitHub issue opened; Q6a `barScale="share" | "relative"`; Q7a stacked rows only).
- Added: `Meter.tsx` (`value`, `max`, `tone`, `thresholds`, `label`, `valueText`; `role="meter"`; no reading = no fill element and "No reading"; invalid `max` falls back to 100; also exports `MeterBar`, `meterPercent`, `meterMax`) and `BreakdownList.tsx` (rows of name, count, share with a decorative Meter bar, `barScale`, `formatValue`, empty text). `styles.css`: `.vs-meter*` and `.vs-breakdown*`. Tokens (additive, mirrored in `tokens.json`): `--vs-meter-height` 6px, `--vs-meter-track`, `--vs-meter-fill`, `-success`, `-warning`, `-danger`, `-neutral` (status colours darkened with black: the plain warning yellow is 1.19:1 and success green 2.27:1 on the track; the warning fill therefore looks olive). No raw colour added.
- `scripts/check-tokens.mjs`: every fill >= 3:1 on the track, the token values, the stylesheet rules of the meter, ticks and breakdown, share text 14:1. Docs: new pages `docs/components/meter.html` and `breakdown-list.html`, both in the sidebar (`shell.js`).
- Checked: `check:tokens` OK (176 tokens, 54 raw colours); `tsc --noEmit` exit 0; `vitest` 277/277 (was 248; 29 new tests for the #25 acceptance cases: 0, 25, 50, 75, 100, null, negative, above max, threshold positions, invalid input, ARIA); 9 component mutations each fail a test; 9 token/CSS mutations each fail `check-tokens`; the real components bundled with Vite and rendered in Chromium (bar height 6px, fills, ticks, null = no fill, 120 capped at 100, -5 empty, relative scale), no script errors; both docs pages render and are in the sidebar.
- Not verified: the reports app (its `UsageMeter` and `BreakdownList` stand-ins are not replaced yet, Task 9); the `--vs-alert-*` override path; a phone; a screen reader; no lint or build script. The ticket text for BreakdownList is in the Task 4 report; no GitHub issue was opened.
- Open: Task 5 (DonutChart, issue #72) waits for Master KMO's approval.

---

## 2026-11-23 — Task 3: SummaryCard `variant="metric"`, `tone="dark"`, icon, change chip and sparkline slot, opt-in; not deployed

- Asked: Master KMO approved Task 3 with every recommended answer (Q1a `variant="metric"`, Q2a `icon` in a DS 28px chip, Q3a `sparkline` slot, Q4a dark tone sets the first chart colour to lime, Q5a metric uses `--vs-card-radius-lg`, Q6a `change` prop with a new `--vs-color-danger-text`, Q7a `--vs-summary-value-letter-spacing` -0.05em on metric only).
- Tests first: `SummaryCard.test.tsx` was written against the unchanged component and committed alone (`71bcb6c`): 4 tones with badge/unit/description, minimal, no tone, no badge, loading, extra class (9 combinations). They pass unchanged after the change.
- Added: in `SummaryCard.tsx` `variant` (`classic` default | `metric`), `tone="dark"`, `icon`, `change` ({ text, direction }), `sparkline`; exported `SummaryCardChange`. Metric = header row (icon, label, change chip), then value and sparkline on one row, 20px corners. The change chip also reads its direction in words ("Increase: +18.4%"). `styles.css`: dark tone, metric, chip, icon, spark slot. Tokens (additive, mirrored in `tokens.json`): `--vs-color-danger-text` (danger border mixed 15% with black, 5.4:1 on the danger fill; the plain danger border is 4.18:1) and `--vs-summary-value-letter-spacing`. No raw colour added.
- `scripts/check-tokens.mjs`: 7 contrast pairs of the new styles >= 4.5:1, 9 stylesheet rules and 2 token values. Docs: section 10b in `docs/components/card.html`, a "Danger as text" row in `docs/foundations/colors.html`.
- Checked: `check:tokens` OK (169 tokens, 54 raw colours); `tsc --noEmit` exit 0; `vitest` 248/248 (was 235); 6 component mutations each fail a test; 7 token/CSS mutations each fail `check-tokens`; the real components (SummaryCard + `LineChart` sparkline at 24px) bundled with Vite and rendered in Chromium: value and sparkline share one centre line, no overlap, the sparkline is lime in the dark card without any prop, metric 20px and classic 8px corners.
- Not verified: the reports app (no page uses the variants yet; its `.vs-summary-card` radius and entrance-animation rules were not touched); a phone; a screen reader; no lint or build script in this repo. Blade, `Badge` (its success text is 2.36:1, danger 4.18:1) and the main site are not changed.
- Open: Task 4 (ProgressBar and BreakdownList) waits for Master KMO's approval.

---

## 2026-11-23 — Task 2: Button `accent` emphasis (lime pill) and SegmentedControl `variant="dark"`, opt-in; not deployed

- Asked: Master KMO approved Task 2 with every recommended answer (Q1a `emphasis="accent"`, Q2a hover/pressed by `color-mix` in tokens, Q3a weight 700 token, Q4a `variant="dark"`, Q5a inactive text `--vs-color-text-body`, Q6a `DateRangeSelector` not touched, Q7a no Blade, Q8a regression tests first).
- Tests first: `Button.test.tsx` and `SegmentedControl.test.tsx` were written against the unchanged components and committed alone (`b01445f`): every emphasis x size, defaults, disabled, icon + text, icon-only, pass-through props; every SegmentedControl combination. They still pass unchanged after the change.
- Added: `emphasis="accent"` in `Button.tsx` (lime fill, dark text, pill, weight 700; icon-only = filled lime circle) with hover/pressed rules in `styles.css`; tokens `--vs-button-accent`, `-text`, `-hover` (92% lime + black), `-pressed` (84%), `-font-weight` (700), mirrored in `tokens.json`; `variant="dark"` in `SegmentedControl.tsx` (class `vs-segment-control--dark`: pill track, dark selected option with white text, inactive text `--vs-color-text-body`). No raw colour added; defaults (`emphasis="primary"`, `variant="default"`) render byte-for-byte as before.
- `scripts/check-tokens.mjs`: accent text on lime / hover / pressed >= 4.5:1 (13.0 / 10.9 / 9.1), white on the dark option and body text on white >= 4.5:1, the accent tokens point at their primitives, and `react/src/styles.css` must hold the hover, pressed and dark rules. Docs: section 07b in `docs/components/button.html`, 06b in `docs/components/tabs.html`, `accent` in the Props table.
- Checked: `check:tokens` OK (167 tokens, 54 raw colours); `tsc --noEmit` exit 0; `vitest` 235/235 (was 223); 6 mutation checks of the components each fail a test; 6 of the stylesheet/token gates each fail `check-tokens`; docs pages render without script errors.
- Not verified: the look in the reports app (no page uses the variants yet); lime/dark on real devices; a screen reader; no lint or build script exists here. Blade and `DateRangeSelector` are not changed (their own tasks).
- Open: Task 3 (SummaryCard) waits for Master KMO's approval.

---

## 2026-11-23 — Dashboard design tokens, Task 1 of the controlled migration (additive only); not deployed

- Asked: Master KMO approved decisions D1-D4 (via ChatGPT) and Task 1 only: add additive tokens for the Reports dashboard direction. D1 option B: `--vs-card-radius` and `--vs-item-card-radius` stay as they are, a new `--vs-card-radius-lg`. D2: lime action colour with dark text. D3: lavender header band on a flat `#F8F8F8` page. D4: violet and chart colours.
- Added (7 tokens in `tokens/tokens.css`, mirrored in `tokens/tokens.json`, docs copy synced): `--vs-card-radius-lg` (= `--vs-radius-xl`, 20px); `--vs-color-lavender-surface`, `--vs-color-lavender-surface-strong`, `--vs-gradient-header-lavender` (same colour-mix formula as the vectorsticker.com facelift, no new raw colour); `--vs-chart-line-primary` (`#2E7D32`, one new allowlisted raw colour), `--vs-chart-series-downloads` (= badge-free violet), `--vs-chart-today-marker` (= brand-secondary).
- Reused, not duplicated: the lime action colour is `--vs-color-brand-accent` with `--vs-color-brand-secondary` text; the secondary chart series is the existing `--vs-chart-series-2`. The orange `--vs-chart-today` is unchanged (the marker has its own token).
- `scripts/check-tokens.mjs` gets gates: dark text on lime >= 4.5:1 (13.0:1), the three new chart colours >= 3:1 on white, and the additive tokens must exist and point at their primitives. Docs: Lavender section in `docs/foundations/colors.html`, a `--vs-card-radius-lg` row in `docs/components/card.html`, the three chart tokens in `docs/components/line-chart.html`.
- Checked: `npm run check:tokens` OK (155 -> 162 tokens, 53 -> 54 raw colours); all 155 earlier tokens have identical values; 5 mutation checks each fail the gate; `tsc --noEmit` exit 0; `vitest` 223/223. The lavender token renders the same colour as the live site's header band (`color(srgb 0.952695 0.94472 0.994427)`).
- Not verified: no component reads the new tokens yet (Tasks 2-10); the Blade copy on the main site is a separate file and is not touched (it still has the old copy, e.g. `--vs-card-radius: 3px`); no lint or build script exists in this repo.
- Open: Task 2 (Button and SegmentedControl variants) waits for Master KMO's approval.

## 2026-11-21 - Reveal owns its lifecycle: nothing replays after the opening (audit finding 2, decision 2a); branch feat/reveal-provider-lifecycle; merged (PR #97, 9e15076)

- Asked: Master KMO, "complete all the tasks asap" after the adversarial audit: Priority 1 of the audit (a view shown again replays the opening and hides its content for 1.2 s, and the app needed its own guard) with the Provider-owned design chosen earlier (decision 2a).
- Measured before: re-inserting the `main` item 3.2 s after the opening gave opacity 0 at 300ms and 0.99 at 1.8 s; re-inserting the curtain made it visible again.
- Changed (`react/src/components/Reveal.tsx`, React only): `Reveal` keeps a state "the opening is playing" that turns false after the opening time, read from the tokens with their unit (curtain + body delay + the longer of an entrance and a 30-letter title + 200ms; reduced motion: at once; falls back to 1050/150/700/420/35 where tokens cannot be read). The context now carries that state; `RevealItem` and `RevealText` read it once when they mount. So an item or title that mounts after the opening is plain (no attribute, no letters), one that mounts during it still plays, one that was already there is not touched when it ends. `Reveal`'s module flag (`alreadyPlayed`, first `Reveal` of a page load plays) is unchanged; outside any `Reveal` an item still gets its attribute. Uses global `setTimeout`/`clearTimeout` and cancels the timer on unmount. Docs: the "Plays once per page load" rule on the Reveal page now says what React does and what Blade/plain HTML still does.
- Checked: `npm test` 276 pass (7 new in `RevealLifecycle.test.tsx`: shown again after the opening is plain, remount during the opening still plays, existing markup untouched at the end, `play={false}`, StrictMode and timer cleared on unmount, reduced motion, default outside Reveal), `tsc` clean. Deliberate breaks, each caught: item always plays, title always splits, opening never ends, timer not cleared. Two of my own mistakes found by the tests: the first run failed because the test used 2450ms instead of the computed 2870ms (the test, not the component), and a first "no state update after unmount" assertion could not fail (React ignores it), so it now checks that `clearTimeout` is called.
- Not verified: a real browser run of a view that remounts (the unit tests use jsdom, the timing is the tokens' sum, not a measured animation end; an `animationend`-based end could be exact but a title that never mounts would never end it); multiple React roots (they share the module flag as before); SSR/hydration (the server renders the curtain as before; not run); Blade (no equivalent: documented).
- Consumers: the reports site can delete its own once-guards (`OverviewTitle`, `KpiLabel`) after bumping the pin.

## 2026-11-21 - Reveal: content that is not shown yet cannot take keyboard focus; LCP warning in the docs (audit findings 3 and 5); branch fix/reveal-focus-and-lcp-docs; merged (PR #99, 984c2df)

- Asked: Master KMO, "complete all the tasks asap" after the adversarial audit: findings 3 (hidden content takes focus) and 5 (the opening delays the LCP).
- Measured before (Chromium): with the curtain up (body at opacity 0), Tab put focus on a link inside the body (invisible focus). LCP of a page whose largest content is a heading: 20 to 40 ms without the Reveal, 1924 to 1936 ms with the heading inside a `data-vs-reveal="fade"` element (headless, 390px, no throttling, 5 runs each).
- Changed: in the `vs-reveal` CSS block (React, Blade, docs copy) the `from` keyframe of `slide-left`, `fade` and `rise` also sets `visibility: hidden`. The hidden state is still only inside the keyframes (fill-mode backwards), so reduced motion and JavaScript off still show the content; `visibility` interpolates as visible from the first moment of the entrance, so only the waiting time (about 1.2 s) is hidden. During that time the content is also not in the accessibility tree. The demo page has a link in the body; the browser check has 2 new checks (while the body is not shown, Tab does not land on the link; after the opening the link can take focus). Docs: a Performance section on the Reveal page (the measured numbers, when it is fine, what to leave outside: the hero heading and image of a public page; measure before turning it on), a Keyboard rule, a note in the Blade README. No `inert` on the page (it would interfere with the app's own focus handling).
- Checked: `check:tokens` OK (block equal in React and Blade, docs copy equal), Chromium browser check all pass including the 2 new ones; the deliberate break (no `visibility` in the fade keyframe) is caught: focus lands on the link.
- Not verified: WebKit and Firefox (CI is the first run: `visibility` inside keyframes with `animation-fill-mode: backwards` is believed to behave the same, not run); a screen reader; LCP on a real phone or with throttling; whether a page needs a way to exclude its LCP element automatically (only documented, no code).

## 2026-11-21 - AnimatedNumber: accessible name without aria-label on a generic span (audit finding 4, ticket #93); branch fix/animated-number-a11y; not merged

- Asked: Master KMO, decision 1a after the adversarial audit: the second of two small fixes (the first is RevealText scripts, #92).
- Found: axe-core 4.10.2 reports `aria-prohibited-attr` (impact serious) for `<span aria-label="4,214"><span aria-hidden="true">...</span></span>` (the markup of `AnimatedNumber` and `x-vs-animated-number`). Many screen readers ignore a name on a role-less span, and the moving text is aria-hidden, so the figure might not be announced at all. Whether NVDA or VoiceOver read it was not tested (no screen reader here).
- Changed: React and Blade now write `<span><span class="vs-animated-number__sr">4,214</span><span aria-hidden="true">...moving...</span></span>` (the pattern RevealText uses): a visually hidden copy of the final text, read once, and the aria-hidden counting text. New class `.vs-animated-number__sr` in `react/src/styles.css` and `blade/components.css` (docs copy equal). The Blade script is unchanged (it updates the aria-hidden span and puts the server text back). Docs: demo markup, the accessibility bullet on the Text Effects page, Blade README. Tests that looked for `aria-label` (`LineChart.test.tsx` AnimatedNumber tests, `AnimatedNumber.test.tsx` helper, the Blade script test markup) now read the hidden copy; the assertions are the same (final text, counting text), only the place they read from changed. New devDependency `axe-core` 4.10.2 (exact, like playwright; test only, so a regression of this kind fails a test) and `textEffects.a11y.test.tsx`: axe on AnimatedNumber (value, decimals, no value), RevealText as a heading in a playing Reveal, the Blade markup, and a control that the OLD markup is reported.
- Checked: `npm test` 265 pass (4 new axe tests), `tsc` clean, `check:tokens` OK, Chromium browser check all pass (the Text Effects demo markup changed). Deliberate break (aria-label again) is caught by the axe test; the control test proves the check can fail. Blade rendered with a real Laravel view engine: the new structure for a value and the fallback for null.
- Consumers: the reports site tests that match the old `aria-label` markup (`CountUpNumber.test.tsx`, `EarningsSummary.test.tsx`) must be updated when its design-system pin is bumped; the main site copy (component and CSS) is not updated yet.
- Not verified: NVDA, VoiceOver, JAWS; axe's colour-contrast rule (jsdom has no layout; not run); how a screen reader treats a figure that changes after it was first read (no live region by design).

## 2026-11-21 - RevealText: scripts that cannot be split keep their original text (audit finding 1, ticket #92); branch fix/reveal-text-scripts; not merged

- Asked: Master KMO, decision 1a after the adversarial audit: fix the two real defects first, in two small PRs; this is the first (RevealText), the second is AnimatedNumber accessibility (#93).
- Measured first (Chromium, fonts in the test container: DejaVu for Arabic, Loma for Thai, FreeSans for Devanagari, Unifont only for Burmese): Arabic "مرحبا بالعالم" is 211px as plain text and 298px split into inline-block letters (+87px, +41%), the joins are lost and the visual order is reversed in an LTR page; "Hello مرحبا World" +28.6px; Latin "Overview Welcome" +2.4px (kerning); Thai and Devanagari kept their width and looked unchanged in that font; Burmese could not be judged (no shaping font). The earlier claim that grapheme clusters are enough was wrong for joining scripts.
- Changed: `RevealText` and `x-vs-reveal-text` split a title only when every character is in Latin, Greek, Cyrillic, Armenian, Georgian, Hangul, Common (digits, punctuation, spaces, emoji) or Inherited (combining marks, joiners, variation selectors); anything else, or a mix, is plain text exactly as when the opening does not play. Allowlist, not denylist, so an untested script is safe by default; Thai, Chinese and Japanese are left out also because they have no spaces and the title could not wrap; Burmese because its stacked consonants are not joined by the grapheme rules (not tested on a real device). Blade: PCRE `\p{Latin}` etc., invalid UTF-8 stays plain. `canSplitIntoLetters` exported from `Reveal.tsx` (not from the package index). Shared fixtures `react/src/fixtures-reveal-text-scripts.json` (22 strings); `check-tokens` runs the React regex and, where `php` exists, the Blade regex against them, so the two rules cannot drift. Docs: "Scripts" bullet on the Text Effects page, Blade README. The old test that pinned Burmese as split into clusters was replaced by a test with a combining accent and a ZWJ emoji, and a new test pins Burmese as plain.
- Checked: `npm test` 265 pass (4 new), `tsc` clean, `check:tokens` OK (JS and PHP rule both run on the 22 fixtures). Deliberate breaks caught: PHP rule without Hangul, JS rule allowing Arabic (check-tokens and unit tests fail). Blade rendered with a real Laravel view engine: Latin and Cyrillic written, Arabic, "Hello 你好" and Burmese plain with the element's other attributes kept.
- Not verified: Burmese, Thai and Indic rendering on real devices (they are plain text now, so nothing breaks, but nobody has seen them animate); other Latin-script fonts with ligatures (Latin kerning is lost when split, measured +2.4px, accepted); Safari/Firefox rendering of the split letters; the main site (not copied yet).

## 2026-11-21 - Docs site redeployed again (ds.vectorsticker.com at `56bc983`); Text Effects page live

- Master KMO said "Deploy both" (this docs site and the reports site) after #88 (Text Effects page, `AnimatedNumber` extended, Blade count-up) and #89 (whole numbers while counting) were merged. Ran on the VPS (hostname `vectorsticker`, user `deploy`), the same command as the deploy of `a3e2b4d`: shallow clone of `main` over HTTPS, backup `/var/www/ds.vectorsticker.com.bak-<date-time>`, `rsync -rt docs/` into `/var/www/ds.vectorsticker.com`, `chown -R www-data:www-data`, temp dir removed. Output: clone of `56bc983` and `text-effects.html HTTP 200` (the command ran under `set -e`, so the `curl` ran only after the copy steps succeeded; `sudo` asked for the password once, which Master KMO typed at the terminal). The reports site was deployed in the same sitting.
- Master KMO looked at the sites afterwards and said "good" (he did not say which page he looked at, so this does not show that he opened the Text Effects page).
- Not verified by Claude: the Text Effects page in a browser (this session's network cannot reach ds.vectorsticker.com); the other docs pages after the sync (rsync has no `--delete`).

## 2026-11-21 - AnimatedNumber: whole numbers while counting when decimals is 0; branch fix/animated-number-whole-steps; not merged

- Asked: while preparing kyawmoo/Report-VectorSticker#326 (use `AnimatedNumber` instead of the local `CountUpNumber`) Claude found that with `decimals` omitted a custom `format` (for example `String`, used in several places of the reports site) was given fractional values such as 123.456 while counting, where the site's own `CountUpNumber` gives whole numbers. Master KMO chose (2a): fix it in the design system.
- Changed: `AnimatedNumber` rounds every in-between value to the step 10^-decimals, so with `decimals` 0 the values are whole numbers (before: only when `decimals` > 0). The final figure is unchanged (the exact value). A caller with a custom `format` and a non-integer value saw fractions on the way before; now it sees whole numbers on the way and the exact value at the end. The default format is unaffected (it rounded anyway). Docs line on the Text Effects page.
- Checked: `npm test` 261 pass (2 new: a custom `format` only sees whole numbers while counting, with in-between values really observed; 12.5 with one decimal in `format` ends on "12.5"), `tsc` clean. Deliberate break (fractions again for decimals 0) is caught. While writing the test one version passed even with the break: one big timer step ran only the last frame, so no in-between value was ever seen; the test now advances in 12 small steps and asserts that an in-between value was seen.
- Not verified: the reports site with it (kyawmoo/Report-VectorSticker#326, next); WebKit and Firefox (no browser check covers this; the unit tests do).

## 2026-11-21 - Text Effects: AnimatedNumber extended, Blade count-up, one docs page for text effects (epic #87); branch feat/text-effects; not merged

- Asked: Master KMO: one "Text Effects" page with two effects (the Overview-style title wipe and the number count-up), later effects are added to it; decisions: (1a) extend the design system `AnimatedNumber` with what the reports site's own `CountUpNumber` has, then the site uses it; (2) a Blade version too. Tickets #84 (AnimatedNumber), #85 (Blade count-up), #86 (docs page), epic #87, and kyawmoo/Report-VectorSticker#326 (use it in the reports site, blocked by #84).
- Changed: `AnimatedNumber`: `value` may be `null` / `undefined` (shows `fallback`, default "—", nothing animates); `decimals` 0 to 6 (the figure moves in steps of 10^-decimals, `format` gets the real value, the last frame passes the value itself so the final figure is never rounded again); default `format` follows `decimals`; counts on from the last number shown (also after an empty value, as the reports site does; ticket #84 said "from 0", the site behaviour was kept); NaN still counts as 0 (existing behaviour). Blade: `x-vs-animated-number` (the server writes the final text with `number_format`, data attributes, `aria-label`, escaped, bad locale falls back to en-US) and `blade/animated-number.js` (no dependency; counts up when the element first scrolls into view, immediately without IntersectionObserver; does nothing for reduced motion; puts the server text back at the end; `VsAnimatedNumber.init(container)` for later elements) with a copy in `docs/assets/` that `check-tokens` keeps equal. Docs: new `docs/components/text-effects.html` (menu entry under Components, two effects with live demos and Replay, usage, props, rules, "Adding an effect" list); the RevealText section of `reveal.html` and the AnimatedNumber props of `line-chart.html` now link to it. Blade README section.
- Checked: `npm test` 259 pass (new: 10 for AnimatedNumber, 7 for the Blade script), `tsc` clean, `check:tokens` OK. Deliberate breaks, each caught: final frame rounded, empty value not handled, decimals ignored, restart from 0 (unit); reduced motion ignored, observer ignored, final text from the formatter instead of the server (script); and in the Chromium browser check: final text wrong, observer ignored, Replay not restarting. Blade rendered with a real Laravel view engine (illuminate/view 10): ints, decimals, negatives, null, a non-number, markup in `fallback` escaped, a bad locale replaced. New Chromium checks: the page loads with both effects and the menu entry, the title ends in plain styles, below the fold shows 0 until scrolled into view, the figures end exactly on the final text, Replay restarts and ends again, reduced motion shows the final state with nothing running. One check had a race (the figure passes through its final text a frame before the last frame, so "ends on" must wait for the last frame): fixed, and the break "final text wrong" is now caught.
- Not verified: WebKit and Firefox (CI is the first run); the Blade count-up inside the main site (Laravel version, its script loading, Livewire pages); that the reports site looks the same with it (ticket kyawmoo/Report-VectorSticker#326 does that with real numbers); how the docs page looks (read as HTML and run in Chromium, but not looked at as a screenshot).
- Open: Report-VectorSticker#326 (use `AnimatedNumber`, `duration={800}`, delete `useCountUp` / `CountUpNumber`); copy `x-vs-animated-number` and the script to the main site; deploy the docs site (rsync).

## 2026-11-21 - Docs site redeployed (ds.vectorsticker.com at `a3e2b4d`); Reveal page live

- Master KMO ran on the VPS (hostname `vectorsticker`, user `deploy`): shallow clone of `main` over HTTPS into a temp dir (SSH `git@github.com` was refused with "Permission denied (publickey)", so the first attempt changed nothing), backup `/var/www/ds.vectorsticker.com.bak-<date-time>`, `rsync -rt docs/` into `/var/www/ds.vectorsticker.com`, `chown -R www-data:www-data`, temp dir removed. Output: clone of `a3e2b4d` (#81 merge) and `reveal.html HTTP 200`; the command ran under `set -e`, so the `curl` at the end ran only after the copy steps succeeded. Master KMO then opened `components/reveal.html` and said it is ok. Ticket #75 closed.
- Also that day: the `deploy` user's password was changed by Master KMO after it was pasted into the chat by mistake (not recorded here).
- Not verified by Claude: the live page in a browser (this session's network cannot reach ds.vectorsticker.com); other docs pages after the sync (rsync has no `--delete`).

## 2026-11-21 - RevealText: per-letter title wipe for the Reveal (V2, ticket #82); branch feat/reveal-text; not merged

- Asked: Master KMO chose (a): move the title wipe prototyped in the reports repo (`feat/reveal-entrance`, `WipeText.tsx`) into the design system, and (while away for an hour) do everything that is left. Ticket kyawmoo/vs-designsystem#82 opened first.
- Added: tokens `--vs-motion-text-duration` (420ms) and `--vs-motion-text-stagger` (35ms) in `tokens.css`, `tokens.json`, the docs copy and `check-tokens` (shape + json equals css). CSS in the same `vs-reveal` block of `react/src/styles.css` and `blade/components.css` (+ docs copy): `[data-vs-reveal-text] .vs-reveal-text__letter` with two animations (rise from 0.85em, scale 0.6; focus from blur 8px, 65% of the time), delay = curtain + body delay + `--i` x stagger, fill-mode backwards (hidden state only in keyframes, as in V1), a visually hidden copy class, a word class that keeps words together, reduced motion switches the letter animation off. React `RevealText` (`text`, `as`, default `span`; exported with `RevealTextProps`): inside a playing `Reveal` it renders the element with `data-vs-reveal-text`, a hidden real copy and aria-hidden letters grouped by word (letters are grapheme clusters via `Intl.Segmenter`, fallback `Array.from`; `--i` stops at 30); otherwise plain text. Blade `x-vs-reveal-text` (`@aware` play, `as` from a fixed list: span, div, p, h1 to h6, else span; every piece escaped; letters by `\X`). Docs: "Title: RevealText" on `docs/components/reveal.html`, section in `blade/README.md`; the demo page's title is now letters.
- Checked: `npm test` 242 pass (6 new in `RevealText.test.tsx`), `tsc` clean, `check:tokens` OK (163 tokens). Three deliberate breaks of the component each caught (no grapheme split, no clamp at 30, play ignored). Blade rendered with a real Laravel view engine (illuminate/view 10, scratch directory): title with attributes, `:play="false"` gives plain text and `<h1>` only, `as="script"` renders `span`, `<b>` in the text is escaped, an empty text renders empty spans, Burmese text stays in whole clusters. Chromium browser check: 2 new checks (8 letters start in order 35ms apart, the first 150ms after the side menu; afterwards every letter is opacity 1, no transform, no filter) plus all old ones pass; two deliberate CSS breaks caught: stagger 35ms to 120ms (4 checks fail), reduced-motion rule for letters removed (3 checks fail); both restored.
- First CI run of this PR (head `5cc9d9f`): Chromium and Firefox passed; WebKit failed 3 checks that look at the end state ("afterwards ... plain styles", "title: afterwards every letter ...", "phone width ..."): after the fixed 900 to 1100ms wait the side menu was at `translateX(-35.6px)`, body and header at opacity 0.06 and the first letters part way (animation start times and the 35ms gaps were right: +1050/+1200, letters 35ms apart). So WebKit's frames came late (the 8 blurred letters were added in this PR, the same sleep passed in the previous PR), and a fixed sleep is the wrong tool. Cause shown by the log: the timing was right, the check looked too early; why WebKit's frames lag was not investigated (WebKit cannot be run here). Fix in the check: `waitForEntrances` waits until no entrance animation is left (up to 10s) instead of sleeping; an entrance that never ends still fails (deliberate break: letters with `infinite` iteration, 4 checks fail in Chromium).
- Not verified: WebKit after that fix (the CI of the next push is the run); how it looks and feels next to the reference recording (only Master KMO can say); Blade letter splitting for Burmese on the main site's PHP/PCRE version (`\X` result differs by Unicode version); the reports site and the main site do not use it yet.
- Open: use it in the reports Overview title (a PR in kyawmoo/Report-VectorSticker after this merges and the pin is bumped); copy to the main site (components, CSS block and the two new tokens in its partial `vs-tokens.css`).

## 2026-11-21 - Reveal browser check: measure the start of each animation from the animation, not from the event; branch fix/reveal-check-webkit-timing; not merged

- Asked: Master KMO chose (a) after the WebKit job of `reveal-browser-check` was red on `main` (run 44917216902, #80 merge): "order: the side menu starts about 1 second after the curtain" measured +774ms, the check wanted more than 800ms (the PR run before it measured +924ms and passed; Chromium and Firefox measured +1049/+1050).
- Cause (partly known): the check took the times of the `animationstart` events. An event reaches the page in some later frame, so the measured gap between two animations depends on when each event was delivered. Only that the check's measurement is unreliable is shown by the three numbers above; WebKit could not be run here (the Playwright WebKit download is blocked in this environment), so whether WebKit's real animations start earlier than the CSS says is NOT known yet.
- Changed (`react/browser/reveal-check.mjs` only): an init script samples `document.getAnimations()` every frame and records, per animation, `startTime + delay` on the document timeline. The order check now uses these times and expects the CSS contract: side menu 900 to 1200ms after the curtain (1050ms from the token), body and header 100 to 250ms after the side menu (150ms). The event times are kept in the message of the check for comparison, not used. If an animation time is missing the check fails.
- Checked in Chromium: all checks pass (animation start +1050/+1200/+1200; events +1050/+1199/+1199). Two deliberate breaks of the CSS are caught: `--vs-motion-delay-body` 150ms to 600ms (3 checks fail) and `--vs-motion-duration-curtain` 1050ms to 600ms (1 check fails); both restored, `git status` clean apart from the script.
- Not verified: WebKit (CI is the first run: it will show both measures in its message, so a real WebKit offset, if there is one, will show up there and the check will stay red rather than hide it); Firefox after the change.

## 2026-11-21 - Reveal Blade components (PR 6a of the Reveal plan: design system side); not deployed

- Asked: Master KMO chose "a": start PR 6 (Blade components, then the main-site copy). This entry is the design-system half; the main-site copy-sync is the next step.
- Added: `blade/components/vs-reveal.blade.php` (curtain `div.vs-reveal-curtain`, `aria-hidden`, when `play` is true, then the slot) and `blade/components/vs-reveal-item.blade.php` (the element itself: `as` from a fixed list of tags, `variant` slide-left | fade | rise, with fallbacks; sets `data-vs-reveal` only while the parent plays, read with `@aware`; outside a `vs-reveal` it plays, like React). Docs: "Usage: Blade" in `docs/components/reveal.html`, a section in `blade/README.md`. The CSS is the `vs-reveal` block that already is in `blade/components.css` (PR 2).
- Checked: rendered with a real Laravel view engine (illuminate/view 10 in a scratch directory, anonymous component path = `blade/components`): the full page renders one curtain and the two items with the attributes; `:play="false"` gives no curtain and no attribute; a bad `as` (`script`) renders `div`; a bad variant renders `fade`; an item outside `x-vs-reveal` plays; extra attributes (class, id) are passed through; a nested item renders its own attribute (the CSS makes it inert, as in React).
- Not verified: inside the main site's Laravel app (version, Livewire), in a browser with this markup (the CSS is the same block checked in Chromium, WebKit and Firefox by the browser check on the plain HTML demo, not on Blade output). `npm run check:tokens`: OK (161 tokens).

## 2026-11-21 - Reveal React components (PR 4 of the Reveal plan; on top of the browser check PR); not deployed

- Asked: Master KMO approved the plan, then (2a) to wait for the CI result of the first three PRs before starting this one. CI result first: all five checks of PR 78 were green, and the job logs of webkit and firefox each show all 10 checks as PASS (WebKit's side menu started 924ms after the curtain's start event, Chromium and Firefox 1049ms; the cause was not looked into).
- Added (`react/src/components/Reveal.tsx`, exported from `react/src/index.ts`): `Reveal` (adds the curtain `div.vs-reveal-curtain`, `aria-hidden`, and no wrapper element; prop `play`, read once at mount: default true for the first `Reveal` of the page load and false for later ones, so a second mount after a logout and login does not replay; the flag is module state set in an effect, so StrictMode's double mount does not matter) and `RevealItem` (the element itself: `as` default `div`, `variant` `slide-left | fade | rise` default `fade`, other props pass through, writes `data-vs-reveal` only while the opening plays). Rules from the earlier decisions: variant not kind (the design system uses variant/tone/emphasis/shape/size, "kind" is not used), the item is the element not a wrapper, `RevealText` and cascade are not in V1.
- Docs: `docs/components/reveal.html` gets "Usage: React" with the props table.
- Tests: `Reveal.test.tsx` (9) and `RevealOnce.test.tsx` (4, its own file because the once-per-page-load flag is module state and every test file has fresh modules; the tests walk one page load in order, the first under StrictMode). `npm test` 236 (was 223), `tsc --noEmit` clean. Seven deliberate breaks of `Reveal.tsx` are each caught (guard removed, item attribute always set, curtain not `aria-hidden`, a wrapper added, `as` ignored, curtain rendered when not playing, guard never set).
- Not verified: the component in a real browser (jsdom runs no CSS; the demo page of the browser check is plain HTML, not React output; the first real check is the reports site in PR 5); the GitHub run of this PR; the typing of `as` for components that do not accept the extra props (only a component that spreads them was tried).

## 2026-11-21 - Reveal browser check and CI job (PR 3 of the Reveal plan; on top of the Reveal CSS PR); not deployed

- Asked: Master KMO approved the Reveal V1 plan, decision 3a: Playwright as a development dependency plus one CI job, instead of a manual script (this machine has Chromium only, so WebKit and Firefox can only be checked on GitHub).
- Added: `playwright` 1.63.0 (exact, the version this was run with) in `react/package.json` devDependencies and `react/package-lock.json` (+30 lines; `npm ci --dry-run` is in sync); `npm run test:browser` (in `react/`) runs `react/browser/reveal-check.mjs`, which serves `docs/` itself and loads the real demo page `docs/assets/reveal-demo.html`: 10 checks per browser (the curtain and the waiting content, the plain state afterwards with nothing held, nested item inert, order of the entrances, reduced motion at load and switched on while it runs, an opening that starts while the page is scrolled and does not take clicks, JavaScript off (compared by screenshots, so it is the same in every engine), phone width, the docs page). A browser that cannot start is a FAIL with exit code 1, never a silent pass. `CHROMIUM_PATH` lets a machine use a Chromium it already has.
- Added: `.github/workflows/reveal-browser-check.yml`: one job each for chromium, webkit and firefox (`npx playwright install --with-deps <browser>`, then the check), `fail-fast: false`, `permissions: contents: read`, and only when a file the check covers changes (paths filter, 12 paths, all checked to exist).
- Checked (Chromium only, here): all 10 checks pass on the real files. Six deliberate breaks of the CSS are each caught: a hidden state in a base rule (opacity: 0), the nested guard removed, the curtain never hidden at the end, the reduced-motion block removed, the curtain taking clicks, the side menu not waiting for the curtain. Two of them were NOT caught by the first version of the script (a curtain that never ends crashed the script instead of failing a check, and the click test point sat under the Replay button); both were fixed and re-run. `webkit` on this machine fails with "Executable doesn't exist" and exit code 1, as intended. `tsc --noEmit` clean, `npm test` 223/223, `npm run check:tokens` OK. The workflow file parses as YAML.
- Not verified: the GitHub run itself (WebKit and Firefox have never been run by me: the first CI run of this PR is their first result, and a failure there may be a real browser difference or a too tight limit in the check, which has to be looked at, not skipped); the Playwright version 1.63.0 on the GitHub runner; nothing of the React or Blade components yet.

## 2026-11-21 - Reveal CSS and docs page (PR 2 of the Reveal plan; on top of the motion tokens PR); not deployed

- Asked: Master KMO approved the Reveal V1 plan (decisions 1a, 2a, 3a, kyawmoo/vs-designsystem#75). PR 2: the shared CSS and its docs page. No React or Blade component yet (PRs 4 and 6).
- Added: one CSS block (`/* vs-reveal:start ... vs-reveal:end */`) at the end of `react/src/styles.css` and `blade/components.css` (same text; the docs copy `docs/assets/blade-components.css` follows): `.vs-reveal-curtain` (a fixed, click-through layer; a mask hole grows from the top-left corner with `@property --vs-reveal-r`; one animation grows it and hides the layer at the end; `hypot()` screen diagonal where supported, else `150vmax`) and `[data-vs-reveal="slide-left | fade | rise"]` on the element itself (no wrapper). The hidden state exists only inside the keyframes (`animation-fill-mode: backwards`), a nested `data-vs-reveal` is inert, and `prefers-reduced-motion: reduce` hides the curtain and stops the animations. All timing comes from the `--vs-motion-*` tokens; no raw colour (curtain = `--vs-color-brand-secondary`).
- Docs: `docs/components/reveal.html` (demo in an iframe so the curtain covers the frame, usage as plain HTML, variants, rules, accessibility, browsers, tokens), the demo page `docs/assets/reveal-demo.html` (plain HTML; also the fixture of the browser check in PR 3), and a Reveal entry in `docs/assets/shell.js`.
- `scripts/check-tokens.mjs` check 7: the Reveal block must be identical in the React and Blade CSS, and every `--vs-*` token it reads must exist.
- Why the curtain is a fixed layer and not a clip-path on the page: tried in Chromium on 2026-11-21 (scratch pages): a fixed layer does not depend on the scroll position, does not take clicks, needs no wrapper element, and a 1ms second animation does not hide a layer (a single animation does).
- Checked (Chromium only, headless, the real files served from `docs/`): curtain visible and growing while side menu, header and body wait; afterwards the curtain is `visibility: hidden` and every element is back to plain styles; side menu starts 1049ms after the curtain, fade and rise 150ms after that; nested item does not animate; reduced motion at load and switched on WHILE it runs (nothing stays hidden); the opening restarted while the page is scrolled (curtain still grows from the screen corner, does not take clicks); phone width; JavaScript disabled (pixels: dark at 300ms, page visible at 2.7s); the docs page loads with the frame and the sidebar entry. `npm run check:tokens` OK; four deliberate breaks of check 7 are each caught (a block that drifts, a deleted block, a token that does not exist, a raw colour).
- Not verified: WebKit and Firefox (this machine has Chromium only; the browser check and CI job come in PR 3); the behaviour without `@property` (described from the web.dev support table, not run); BFCache (headless Chromium did not restore the page, so it was not tested); Livewire re-rendering (only morphdom 2.7.8 was tried: unchanged elements do not replay, new or replaced ones do); the look on a real phone; nothing uses the CSS yet.

## 2026-11-21 - Motion tokens for the Reveal (PR 1 of the Reveal plan); not deployed

- Asked: Master KMO approved the Reveal V1 plan (kyawmoo/vs-designsystem#75): the page-opening animation becomes a small design system module. PR 1 only adds the timing tokens; no component, no CSS rule, no visible change.
- Added: `--vs-motion-duration-curtain` 1050ms, `--vs-motion-duration-enter` 700ms, `--vs-motion-delay-body` 150ms, `--vs-motion-ease-standard`, `--vs-motion-ease-decelerate`, `--vs-motion-rise-distance` 14px, in `tokens/tokens.css`, `tokens/tokens.json` (new "motion" group) and the docs copy `docs/assets/tokens.css`. The values come from the prototype Master KMO tried in the reports site (1050ms was his choice after asking for faster; 700ms, 150ms, the curves and 14px are my Estimate, none was measured against a target). Before this there was no motion token (checked: no duration/easing/transition in `tokens.css`).
- `scripts/check-tokens.mjs`: check 6: durations are `Nms`, easings are `cubic-bezier()`, rise distance is `Npx`, and `tokens.json` holds the same value as `tokens.css`.
- Checked: `npm run check:tokens` OK (161 tokens, was 155). Four deliberate breaks are each caught (a duration without its unit, json and css disagreeing, a token missing, an easing that is not a cubic-bezier).
- Not verified: the CI run on GitHub (only run locally); nothing uses the tokens yet.

## 2026-11-01 — MobilePageHeader: optional `trailing` slot (a control next to the title on a phone); not deployed

- Asked: Master KMO chose (a)+(c): the title and the date-range selector on one row on the phone headers of the reports pages that still show the old filter icon (Social, Download Activity, Users). `MobilePageHeader` had no place for a control next to the title (title on 80%, one filter icon on 20%), and it also holds the back arrow, so a page could not build this without a custom header. This is the design-system half (ticket "Add trailing slot to MobilePageHeader"); the reports pages follow in a separate change there.
- Added (`react/src/components/MobilePageHeader.tsx`): optional `trailing?: React.ReactNode`. With it, the title takes the rest of the row (`flex-1 min-w-0`, cut with an ellipsis when too long) instead of 80%, the control sits on the right (`shrink-0`) and keeps its size, the back arrow stays; if `onFilterClick` is also given the filter button comes after the control. A `null`, `false` or missing `trailing` changes nothing.
- Regression guard: the new `MobilePageHeader.test.tsx` holds the exact HTML the component produced BEFORE the change for four combinations (plain, no back arrow, with filter, active calendar filter) and asserts the new code produces the same strings without `trailing`.
- Tests: `MobilePageHeader.test.tsx` (6); `npm test` 223/223 (was 217), `tsc` clean, `check:tokens` OK. Mutation checks, each fails a test: null counts as trailing, control can shrink, filter button before the control, title stays 80%, back arrow dropped with trailing, filter button lost without trailing.
- Not verified here: the look in a browser. `MobilePageHeader` is built from Tailwind classes, so it is checked in the reports site build (which has Tailwind), in that change. There is no docs page for `MobilePageHeader` in this repo (there was none before either); this prop is described in its code comment only.

---

## 2026-11-01 — DateRangeSelector gets a Custom date range (Popover + RangeCalendar); docs deployed (`0138f16`)

- Asked: third and last design-system PR for the custom date range (after Popover and RangeCalendar), as decided by Master KMO (phone = bottom sheet, week starts Sunday, no typing in the date fields in v1, dates shown `DD MMM YYYY`, values `'YYYY-MM-DD'` text, the page sets `maxDays` / `minDate` / `maxDate`).
- Added to `DateRangeSelector`: `allowCustom` (default false: nothing changes without it, the 19 existing tests are untouched and pass), `customRange`, `onCustomChange`, `minDate`, `maxDate`, `maxDays`, `weekStartsOn`; exported `DATE_RANGE_CUSTOM_ID` (`'custom'`, the `value` that means the custom range). Desktop: a divider and a calendar button after the presets (`aria-haspopup="dialog"`, `aria-expanded`, `aria-pressed`; when applied it shows `14–20 Oct`, its name is "Custom range 14–20 Oct" so it starts with the visible text, `title` has the full dates). It opens a `Popover` (aligned to the button's right edge) with From / To read-only fields (`DD MMM YYYY`, "Pick a date"), the "N days selected" count, a two-month `RangeCalendar`, a help line ("Days after today are unavailable." or "Latest day: ...", "Earliest day: ...", "Pick up to N days.") and Cancel / Apply (the DS `Button`). Apply is off until both dates are picked; it calls `onCustomChange({ from, to })` and then `onChange('custom')` (only if the value is not already `'custom'`), closes, and focus returns to the button. Cancel / Escape / click outside change nothing and a reopened picker starts from the applied range. Phone: the sheet list gets a "Custom range…" row (shows "Custom range: 14–20 Oct" when applied); it opens the same picker as a bottom sheet with one month; the trigger shows the dates. `Popover.tsx` now exports its `useIsNarrow` hook (internal, not in `index.ts`); `.vs-date-range__sep` and `.vs-drp*` CSS in `react/src/styles.css` (tokens only).
- Docs: `docs/components/date-range-selector.html` gets a Custom range section (button states, the picker rendered from the real component's markup, behaviour table, new props, usage); the old "Not included (yet)" box is gone.
- Tests: `DateRangeSelector.test.tsx` +14 (33 in the file); `npm test` 217/217 (was 203), `tsc` clean, `check:tokens` OK. The custom tests fake only `Date` (today = 20 Nov 2026) so they do not depend on the day they run. Mutation checks, each fails at least one test: no `onCustomChange`, `onChange('custom')` even when already custom, Apply does not close, applied range not preloaded, button never pressed, no dates on the button, help text without `maxDays`, no phone row, phone row does not open the picker, Apply always enabled, always two months, `maxDays` not passed on, button does not toggle, name without the visible text, phone trigger ignores the custom label. One mutation (a preset kept "active" while custom) is equivalent and cannot fail: the custom branch of the trigger label wins first. The real component in Chromium (1100px and 390px) inside a card with `overflow: hidden`: the picker's right edge equals the button's right edge and it is not clipped, two months, focus on the first control, picking 14 and 20 Oct fills the fields ("7 days selected") and enables Apply, Apply closes it and the button reads `14–20 Oct` with focus back on it; at 390px the sheet row opens a bottom sheet at the bottom of the screen with one month, no sideways scroll; no page errors. Docs page at 1400px and 390px: the older demo still works, no sideways scroll, no page errors.
- Not verified: screen readers; real touch; the docs-site redeploy; the reports site using it (next: the Server Load chart, which also needs a backend `from` / `to`).

- Docs deployed (this entry, the RangeCalendar entry and the Popover entry): Master KMO ran on the VPS: shallow clone of `main` (`0138f16`) to a temp dir, backup `/var/www/ds.vectorsticker.com.bak-<date-time>`, `rsync -rt docs/` into `/var/www/ds.vectorsticker.com`, `chown -R www-data:www-data`, temp dir removed; `components/range-calendar.html` returned HTTP 200. The reports site uses these components from the same day (its pin `0138f16`, see its HISTORY). Master KMO then tried the Custom range on the live Server Health page and said it was fine. Not verified by Claude: the docs pages in a browser after the deploy.
---

## 2026-11-01 — RangeCalendar (pick a From and a To day); docs deployed (`0138f16`)

- Asked: second of three PRs for the custom date range (after Popover). Master KMO's answers: week starts on Sunday (`weekStartsOn` 0 default, 1 = Monday), no typing in date fields in v1 (those belong to the opener, not this component), dates shown `DD MMM YYYY`, values passed as `'YYYY-MM-DD'` text, the page sets `maxDays` / `minDate` / `maxDate` (defaults 365 / none / today).
- Added: `RangeCalendar` (`react/src/components/RangeCalendar.tsx`, exported with `RangeCalendarProps`, `DateRangeValue`) and the pure helpers in `rangeCalendarDates.ts` (exported: `addDays`, `daysInclusive`, `formatDMY`, `formatRangeLabel`, `isIsoDate`, `todayIsoDate`, types `IsoDate`, `WeekStart`); `.vs-rc-*` CSS in `react/src/styles.css` (tokens; ends in the brand colour, the band is a `color-mix` tint of it). One or two months side by side (`months`); first click = From, second = To (reverse order swaps, same day twice = one day, a click after a finished range starts a new one); days outside `minDate`..`maxDate` are disabled; while the second date is pending, days that would make a range longer than `maxDays` are disabled on both sides; hover or keyboard focus previews the band; month arrows stop at the first / last month that can be picked; one tab stop, arrows (day / week), Home / End (week ends, follows `weekStartsOn`), PageUp / PageDown (month), Enter / Space; every day button is named by its full date, `aria-pressed` on the ends, `aria-current="date"` on today. Dates are calendar-day text, so no time zone can shift a day.
- Docs: `docs/components/range-calendar.html` (live click / hover demo using the real component's markup rendered to HTML, three states, behaviour, measurements, usage, props) and a sidebar entry.
- Tests: `rangeCalendarDates.test.ts` (13: parsing incl. leap day and impossible dates, adding days / months across month and year ends, inclusive day counts, month grids for both week starts, labels) and `RangeCalendar.test.tsx` (25: what is shown, picking, swapping, one-day range, new range, limits incl. `maxDays` off-by-one both sides, keyboard incl. not moving onto a disabled day, preview); `npm test` 203/203 (was 165), `tsc` clean, `check:tokens` OK. Mutation checks, each fails at least one test: no swap, max date ignored, min date ignored, `maxDays` ignored, `maxDays` off by one, no ArrowRight, End one day off, no month scroll, keyboard enters a disabled day (this one survived the first version of the tests; a test was added), every day a tab stop, preview never clears, next arrow never disabled, finished range keeps extending, today ring on every day, week start ignored. The real component in Chromium (760px and 390px): 40px day circles in 44px rows, the band runs across week edges with rounded ends, preview band while hovering, picked ends in the brand colour with dark text, future days disabled, real keyboard focus (ring 2px) and PageUp scrolling the month, one month at 390px with both arrows and no sideways scroll. Docs page at 1400px and 390px: demo picks, previews, swaps and ignores a disabled day; no page errors.
- Not verified: screen readers; real touch; very large `maxDays` or `minDate` far in the past (the month arrows work, but not exercised for years); the docs-site redeploy; the reports site using it.

---

## 2026-11-01 — Popover (panel under a button; bottom sheet on a phone); docs deployed (`0138f16`)

- Asked: Master KMO chose to build the custom date range in the design system first (his answers: phone = bottom sheet, week starts Sunday, no typing in the date fields in v1, dates shown as `DD MMM YYYY`, values passed as `'YYYY-MM-DD'` text, page sets `maxDays` / `minDate` / `maxDate`; each DS PR merged by Claude after CI). Three PRs in order: Popover (this one), RangeCalendar, Custom option in `DateRangeSelector`.
- Added: `Popover` (`react/src/components/Popover.tsx`, exported with `PopoverProps`, `PopoverAlign`) and `.vs-popover*` CSS in `react/src/styles.css` (tokens; the shadow and the 40% backdrop are literals, like Modal's and FilterSheet's). Props: `open` (controlled), `onClose`, `anchorRef`, `label` (required), `align` (`end` default / `start`), `sheetBelow` (768), `className`. Escape and a click outside call `onClose` (a click on the anchor does not); focus goes into the panel and Tab stays inside; focus returns to the anchor on close unless the viewer clicked another control; placed under the anchor (above when there is no room), clamped to the viewport, re-placed on scroll / resize / panel size change; drawn in a portal with `z-index: 60`; under 768px a bottom sheet with backdrop, `aria-modal`, page scroll locked; no motion with reduced motion.
- Docs: `docs/components/popover.html` (live desktop demo, phone demo, behaviour, measurements, do/don't, usage, props) and a sidebar entry.
- Tests: new `Popover.test.tsx` (13); `npm test` 165/165 (was 152), `tsc` clean, `check:tokens` OK. Mutation checks, each fails at least one test: no Escape, outside click ignored, anchor counted as outside, no focus into the panel, no focus return, no Tab trap, no viewport clamp, no flip above, no scroll lock. The real component bundled and checked in Chromium (1000px and 390px): the panel's right edge equals the anchor's right edge and it sits 8px below it, it is not cut by a card with `overflow: hidden`, focus goes to the first control, Escape and a tap outside close it, focus goes back to the anchor (or stays on the control that was clicked), the sheet sits at the bottom with the page scroll locked and released. Docs page at 1400px and 390px: no sideways scroll, no page errors.
- Found while checking: a tap on empty page space moves the focus to `<body>` right after the pointer event, so the first version left the focus nowhere on a phone; the close effect now puts it back on the anchor after that (`setTimeout 0`, only if the focus is still on `<body>`).
- Not verified: screen readers; iOS/Android keyboards and real touch; the docs-site redeploy; the reports site using it.

---

## 2026-11-01 — DateRangeSelector fix: buttons stayed visible on a phone in the reports site; not deployed

- Found while putting the component on the reports Overview page (built app in Chromium at 390px): the desktop buttons were still shown next to the phone trigger. Cause (confirmed): the reports site's own `src/index.css` redefines `.vs-segment-control { display: inline-flex }` and loads after this package's CSS; the phone rule `.vs-date-range__desktop { display: none }` had the same specificity and lost.
- Changed (`react/src/styles.css`): the phone-width rules now use `.vs-date-range > .vs-date-range__desktop` / `> .vs-date-range__trigger` (higher specificity, comment says why). No markup or prop change.
- Checked: the fixed CSS applied to the reports build in Chromium: 1280px shows the buttons and no trigger, 390px shows the trigger and no buttons, title and trigger on one row, sheet opens and picks; `npm test` 152/152, `tsc` clean, `check:tokens` OK. The same sheet now seen with the reports site's Tailwind: it slides in from the bottom, styled.
- Not verified / no automated test: jsdom does not run media queries, and a test reading `styles.css` as text did not work in vitest (the `?raw` import returned an empty string), so this fix is covered by the browser check only.

---

## 2026-11-01 — DateRangeSelector (Today / 3D / 7D / 90D, presets only); not deployed

- Asked: Master KMO wants the redesigned day-range selector (made as a canvas design first) in this design system so the reports site can reuse it. Decisions (his answers): (a) build the presets part first, the custom date range (calendar + popover, which this DS does not have) later as a separate task; selected colour = DS `--vs-color-brand-primary` (the reports site's own teal override is its own matter); short labels `3D / 7D / 90D`; ranges include today (the page works out the dates; the component only hands back the chosen `id`).
- Added: `DateRangeSelector` (`react/src/components/DateRangeSelector.tsx`, exported with `DATE_RANGE_PRESETS`, `DateRangeSelectorProps`, `DateRangeOption`) and `.vs-date-range*` CSS in `react/src/styles.css` (tokens only, no raw colour). Desktop: the segmented control look (`.vs-segment-*`, small buttons, ~248 × 41 px measured) with `aria-pressed`, accessible name "7D, 7 Days", focus ring. Under 768px: one trigger button (calendar icon, current range, chevron) opening the existing `FilterSheet`. Props: `value`, `onChange` (not called for the option already selected), `options` (default presets; a page may pass its own, e.g. Today / 3D / 7D), `loading` (spinner + `aria-busy` on the selected button, buttons stay clickable so the latest click wins), `summary` (resolved dates, polite live region), `label`, `className`.
- Why own buttons instead of the `SegmentedControl` component: it renders no `aria-pressed` and no group name, and changing it would alter every existing user (separate task); the new component reuses its CSS classes, so the look is the same.
- Docs: `docs/components/date-range-selector.html` (live desktop demo with dates from today, phone demo with sheet, measurements, states, in-context, do/don't, usage, props, "not included") and a sidebar entry + `calendar` icon in `docs/assets/shell.js`.
- Tests: new `DateRangeSelector.test.tsx` (19); `npm test` 152/152 (was 133), `tsc` clean, `check:tokens` OK. Mutation checks: no same-id guard (2 fail), no `aria-pressed` (3), busy on every button (1), name = full label only (5), sheet never closes (2), no live region (1), no empty guard (1), expanded state fixed (1); one survived on purpose-less change (explicit `aria-hidden` on the spinner is redundant: lucide adds it itself). The real component bundled and checked in Chromium: 1000px shows the buttons and hides the trigger, 390px the reverse; click, keyboard focus ring (2px), sheet open/pick/close; docs page at 1400px and 390px (no sideways scroll after fixing a long path in the hero), no page errors.
- Not verified: the phone sheet with the reports site's Tailwind (`FilterSheet` is built from Tailwind classes; the test page had none and the Tailwind CDN was not reachable, so the sheet's look was not seen); screen-reader behaviour; the docs-site redeploy; the reports site using it (separate change there, view by view).
- Open / separate tasks: custom date range (calendar + popover); `SegmentedControl` has no `aria-pressed`/group name; `FilterSheet` has no Escape key or focus trap; the reports site's own teal override of the active segment.

---

## 2026-10-23 — Docs site deployed (ds.vectorsticker.com at `43823a8`)

- Master KMO asked to deploy everything done today. The docs site is not a git clone (see the reports repo archive, 2026-09-24): ran on the server a shallow clone of `main` (`43823a8`) to a temp dir, backup `/var/www/ds.vectorsticker.com.bak-<date-time>`, `rsync -rt docs/` into `/var/www/ds.vectorsticker.com`, `chown -R www-data:www-data`, temp dir removed. `components/bar-chart.html` HTTP 200.
- This brings the docs-site redeploys flagged as "not verified" in earlier entries (Drawer, Line Chart, Bar Chart, sidebar icons and older docs-only changes) up to date. No Apache restart; the main site and reports site were not touched by this step.
- Not verified by Claude: the pages in a browser.

---

## 2026-10-23 — BarChart style A: slim bars, rounded tops, gradient, hover fade

- Asked: Master KMO found the bar design not good (big gaps between bars, especially with few days); from a demo of styles chose A (slim and rounded).
- Changed (`BarChart.tsx`): bars fill with a soft top-to-bottom gradient, 6px rounded top corners (stacked: only the top part), no 2px gap between stacked parts. Up to 10 days (`BAR_CHART_FEW_DAYS`): wide bars, no width cap (0.94/0.94); more days: up to 28px (0.82/0.9). Hovering a day fades the other days (no redraw animation). Docs `bar-chart.html` demo and behaviour table updated to match.
- Tests: `BarChart.test.tsx` updated (+2: few vs many days; gradient and hover fade); `npm test` 133/133, `tsc` clean, `check:tokens` OK. Real component bundled and checked in Chromium (30-day stacked with hover, 5-day bars + line); docs page, no page errors.

---

## 2026-10-23 — Charts: whole-number y-axis ticks for counts

- Found while switching the reports Users page to `BarChart`: a chart of small counts (0-2 sign-ups a day) showed y ticks 0.5 and 1.5.
- Changed: `BarChart` and `LineChart` set `precision: 0` on the y ticks when every value is a whole number (counts); data with decimals keeps decimal ticks.
- Tests: +1 each in `BarChart.test.tsx` / `LineChart.test.tsx`; `npm test` 131/131, `tsc` clean.

---

## 2026-10-23 — BarChart (stacked, totals, line overlay, animated); sidebar icons for Drawer / charts

- Asked: Master KMO chose (c): build a design-system bar chart first, then switch the reports dashboard's daily charts (all three are bars or bars + line, so `LineChart` alone could not replace them without losing the stacked totals).
- Added: `BarChart` (`react/src/components/BarChart.tsx`), sharing the timeline rules with LineChart (one column per day, today dotted line + bold "(Today)", one empty day after today, missing days empty). Options: `stacked` (parts of a day's total; rounded corners only on the top part, 2px surface gap, tooltip footer "Total"), `showValues` (stacked: day totals; else each value; shown only while every label fits its column, overlapping labels left out), series `type: 'line'` drawn over the bars with a soft area (draws left to right), `axis: 'right'`. Bars grow from the bottom one day after another (900ms in total); no animation with reduced motion. Equal inline props do not redraw. Shared helpers moved to `chartShared.ts` (LineChart unchanged in behaviour).
- Docs: `docs/components/bar-chart.html` (stacked and bars + line demos with Replay, bar or line?, behaviour, usage, props); sidebar entries. Fixed: the sidebar icons for Drawer, Line Chart and Bar Chart were missing from the docs icon set (`panel-right`, `chart-line`, `chart-column` added, lucide 0.546).
- Tests: new `BarChart.test.tsx` (8); `npm test` 129/129, `tsc` clean, `check:tokens` OK. The real component bundled and checked in Chromium (stacked with totals, bars + line with value labels, three-part stack, tooltip with Total; mid-animation and finished); docs page at 1400px and 390px, no page errors, no sideways scroll.
- Not verified: the docs-site redeploy.

---

## 2026-10-23 — LineChart (animated, chart rules built in), AnimatedNumber, chart tokens

- Asked: Master KMO liked the look of daisyUI's line charts (a paid product built on ApexCharts) and wants a pretty, animated chart in the design system. Chose (a): rebuild the look on Chart.js (already used by the reports dashboard; no purchase, no second chart library), as a DS component, after approving a demo page.
- Added: `LineChart` (`react/src/components/LineChart.tsx`): variants `area` (gradient fill, line draws left to right), `line` (lines rise into place, hover crosshair, optional right axis), `sparkline` (no axes/legend/tooltip). Chart rules built in through the pure `lineChartTimeline.ts`: one point per calendar day, today marked (dotted line + bold "(Today)" label, never thinned out), exactly one empty day after today, missing day = null gap (`spanGaps: false`), regular legend. No animation with reduced motion. Equal inline props do not redraw. `AnimatedNumber` (count-up, ease-out, screen readers get the final value, reduced motion shows it at once). `.vs-line-chart*` CSS.
- Tokens: `--vs-chart-series-1/2/3`, `--vs-chart-today`, `--vs-chart-grid`, `--vs-chart-axis-text` in `tokens/tokens.css` (+ docs copy, `tokens.json`) — aliases of existing colours (brand-primary, badge-trending, badge-free, item-status-pending, border, text-muted), so no new raw colour; a site may override them.
- Package: `chart.js` `^4.4.0` is a peer dependency (root and `react/package.json`); dev dependency in `react/` for tests.
- Docs: `docs/components/line-chart.html` (live demos with Replay, rules, tokens, usage, props) and a sidebar entry.
- Tests: new `lineChartTimeline.test.ts` (10) and `LineChart.test.tsx` (11, Chart.js replaced by a recorder in jsdom); `npm test` 121/121, `tsc` clean, `check:tokens` OK. Mutation checks: no future day (6 fail), gap as 0 (2), spanGaps on (1), reduced motion ignored (1), redraw on every render (1), no "(Today)" label (1). The real component bundled and checked in Chromium (area/line/sparkline, animation mid-way and finished, hover tooltip); docs page at 1400px and 390px, no page errors, no sideways scroll.
- Not verified: the docs-site redeploy; the reports dashboard using it (switching its charts is a separate change there, chart by chart).

---

## 2026-10-23 — Drawer component (right-side slide-over panel) and docs (issue 50)

- Asked: Master KMO, "do the design system task for the side panel": the ticket opened on 2026-10-22 when the reports Users page needed a right-side panel (the reports site has a temporary local stand-in, approved by Master KMO).
- Added: `Drawer` (`react/src/components/Drawer.tsx`, exported with `DRAWER_WIDTH`, `DrawerProps`, `DrawerWidth`) and `.vs-drawer-*` CSS in `react/src/styles.css` (tokens; overlay and shadow are the same literals as Modal; reuses `.vs-modal-close`). Props: `open`, `onClose`, `title` (required; heading and dialog name), optional `header` (custom header, title then only names the dialog), `footer` (stays at the bottom), `width` `sm` 400px / `md` 520px (default; the ticket's open question, chosen to match the approved reports mockup), `className`. Overlay click / Escape / close button close; focus goes in on open, Tab wraps inside, focus returns to the opener; page scroll locked while open; 200ms slide-in, none with reduced motion; full width on narrow screens; safe-area insets.
- Docs: `docs/components/drawer.html` (live demo md/sm, anatomy, Drawer or Modal?, measurements, behaviour, usage, props) and a sidebar entry in `docs/assets/shell.js`.
- Tests: new `Drawer.test.tsx` (11); `npm test` 100/100, `tsc` clean, `check:tokens` OK. Mutation checks: no Escape (3 fail), no focus return (1), no Tab trap (1), no scroll lock (1), click inside closes (1), focus stolen on re-render (1). Docs page in Chromium at 1400px and 390px: opens, focus on close, Escape closes, panel full width at 390px, no sideways scroll, no page errors.
- Not verified: the docs-site redeploy; the reports site using it (replacing its stand-in is a separate change there).
- React only; no Blade drawer (out of scope).

---

## 2026-10-11 — SegmentedControl: 8px track, 5px buttons (was full pill)

- Master KMO (2026-10-11): the `7 Days / 30 Days / 90 Days` toggle did not follow the design system's radius value; chose "track `--vs-radius-sm`, buttons `--vs-radius-xs`" (the 5px button value was Claude's pick, Master KMO accepted it by trying it).
- Changed: `.vs-segment-control` -> `var(--vs-radius-sm)` (8px), `.vs-segment-button` -> `var(--vs-radius-xs)` (5px) in `react/src/styles.css`; the demo copies in `docs/components/tabs.html` and `table.html`; wording ("pill") in those docs and the `Tabs.tsx` comment. Blade nav-pills (`.demo-nav-pills`) stay full pills on purpose.
- Checked: `npm run check:tokens` OK. Chromium on the Tabs and Table docs pages: track 8px / button 5px, no page errors; screenshot looks right.
- Not verified: the React `SegmentedControl` on the reports site (its own CSS copy and 2 hand-made pill toggles follow in a separate Report PR). Docs-site redeploy.

---

## 2026-10-11 — Card radius 3px -> 8px (`--vs-card-radius` = `--vs-radius-sm`)

- Master KMO: every box on the reports site must use one radius. `Card` (inline `--vs-card-radius`, 3px) was the odd one next to `SummaryCard` / `TableWidget` (`--vs-radius-sm`, 8px).
- Changed: `--vs-card-radius` is now `var(--vs-radius-sm)` (8px) in `tokens/tokens.css` (copied to `docs/assets/tokens.css`); `tokens.json` card.radius and item-card-radius notes; the 3px statements in `docs/components/card.html`, `docs/foundations/spacing-radius.html`, `blade/README.md` and the `Card.tsx` comment. `Card.tsx` code is unchanged (it reads the token); its `style` prop can still override.
- Open question from the ticket, decided by keeping one token: the card image and badge corners that use `--vs-card-radius` also become 8px (they match the live item card, which already uses `--vs-item-card-radius` 8px).
- Checked: `npm run check:tokens` OK. Chromium on the docs Card page: the token and the demo card, item card, image, badge and panel all compute to 8px, no page errors (icon CDN blocked in the sandbox).
- Not verified: the React `Card` rendered on the reports site (the reports site must update its DS pin first).

---

## 2026-10-06 — Tabs docs rule box: yellow border, very light yellow background

- Master KMO: yellow border all round, very light yellow background, no green left border. The box now uses `--vs-color-warning-border` and `--vs-color-warning-bg` (existing tokens); the "THE RULE" label is heading colour instead of green. Checked in Chromium (screenshot), no console errors, no sideways scroll. Docs-only; needs a docs-site redeploy.

---

## 2026-10-06 — Docs sidebar: two collapsible groups, 14px items

- Master KMO: the left menu should have only Foundations and Components (Form Elements merged into Components), the group titles can be closed, Components open by default, only one open at a time, menu items 14px.
- `docs/assets/shell.js`: NAV now has two groups (the 10 form pages follow the other Components pages; the "Overview / Getting Started" group is gone, the logo still links to the home page). Group titles are buttons (`aria-expanded` / `aria-controls`, chevron). Opening one closes the other; the open one can also be closed. Default open: the group holding the current page, otherwise Components. `docs/assets/shell.css`: items 15px → 14px, toggle styles. No state is remembered between pages.
- Checked in Chromium: default state on a component page, on a foundations page and on the home page; open / close / switch by mouse and by keyboard (Enter); item font 14px; 32 links in total; narrow screens still hide the menu as before; no console errors. Needs a docs-site redeploy.

---

## 2026-10-06 — Tooltip hover delay 300ms → 150ms

- Master KMO: 0.3 s felt long, make it 0.15 s. `TOOLTIP_OPEN_DELAY` in `Tooltip.tsx` (the unit tests read the constant), the docs text and the docs demo script were changed together. Keyboard focus is still immediate, close grace still 100ms.
- Checked: `tsc`, `npm test` 89/89, `check:tokens`; the docs page in Chromium: not open at 80ms, open at 300ms.

---

## 2026-10-06 — Tabs docs: "Tabs or SegmentedControl?" rule box with 3 examples

- Master KMO asked for the Tabs-vs-SegmentedControl rule to be very clear, highlighted, with 3 examples. Added a highlighted box at the top of section 06 of `docs/components/tabs.html`: one question ("different part of the content, or the same content arranged differently?"), two answers, and three working examples: item page Details/Performance/History (Tabs), category list Newest/Popular/Free (SegmentedControl), reports overview 7/30/90 days (SegmentedControl).
- Also fixed a mobile bug already on the page: the anatomy key lines did not wrap, so at 375px the page scrolled sideways (417px wide). Now 375px.
- Checked in Chromium: each example works (panel swap, re-sort, filter, bars), no console errors, no sideways page scroll at 1440px or 375px. Not verified: the docs-site deploy (needs a redeploy).

---

## 2026-10-06 — Tooltip component and docs (issue 28)

- Asked: an accessible Tooltip component with docs. Nothing existed in the DS; the reports dashboard has a local `InfoTip` stand-in (not touched; migrating it is a separate change). Built on top of the Tabs branch because the test setup lives there: merge the Tabs change first.
- Added: `Tooltip` (`react/src/components/Tooltip.tsx`), pure positioning `tooltipPosition.ts`, `.vs-tooltip` CSS (tokens only, flat: no shadow, z-index 60 above the Modal's 50). Hover opens after 300ms, keyboard focus at once, Esc / pressing the control / leaving closes, pointer can move onto the tooltip, one tooltip open at a time. Touch: not shown (a tap performs the action). Renders in a portal (never clipped), flips and slides at viewport edges, no new dependency. Description is a visually hidden `role="tooltip"` linked by `aria-describedby`; the visible copy is `aria-hidden`.
- Docs: `docs/components/tooltip.html` (9 numbered sections) and a sidebar entry in `docs/assets/shell.js`.
- Checked: 57 new unit tests (89 in total); 11 deliberately-broken versions of the component each fail the suite; the docs page's plain-JS position function equals the TypeScript one on 3000 random inputs; Chromium: delay, hover-on-tooltip, Esc, press, mouse-click focus does not show it, touch does not show it, reduced motion, edge flipping, no console errors; `tsc`, `check:tokens` clean.
- Not verified: real screen readers and real touch devices; right-to-left layouts; tooltips on disabled controls (documented as unreliable, use visible text instead).
- Open / separate: Blade version; moving `InfoTip` to this component; proposed measurements (padding, max width, delays, z-index) are not in `tokens.json` yet.

---

## 2026-10-06 — Tabs: primary / secondary underline variants, TabPanel, docs (issue 27)

- Asked: a documented, accessible Tabs component with hierarchical navigation, distinct from SegmentedControl.
- After merging main (the pill switch was renamed `SegmentedControl`, `Tabs` kept as a deprecated alias): `Tabs` without `variant` now just renders `SegmentedControl`; the underline variants are additive. The segmented `disabled` item support added earlier was dropped (SegmentedControl has none).
- Decision (Master KMO, "agree, proceed (a)"): `Tabs` already existed but was the pill-shaped segmented switch, used by ~8 views of the reports dashboard. It was **extended, not replaced**: new `variant` prop, default `'segmented'` = exactly the old output; `'primary'` / `'secondary'` are the new underline tabs.
- Added: `variant`, `id`, `label` on `Tabs`; `icon` / `badge` / `disabled` on `TabItem` (underline variants only); new `TabPanel` (`react/src/components/Tabs.tsx`); `.vs-tabs` / `.vs-tab` / `.vs-tab-panel` CSS (`react/src/styles.css`, tokens only, no new tokens). ARIA tablist pattern, roving tabindex, Left/Right/Home/End with automatic activation, horizontal scroll instead of wrapping, inset focus ring, reduced-motion respected.
- Docs: `docs/components/tabs.html` rewritten to the Search Input page layout (10 numbered sections). The old segmented / Blade nav-pills content is kept in section 06.
- Tests: first unit tests in this repo (vitest + jsdom + Testing Library, `react/vitest.config.ts`, new CI step): 32 tests. Checked: all five deliberately-broken versions of the component fail the suite; the default (segmented) render is byte-identical to the previous component for 16 prop combinations; `tsc --noEmit`, `check:tokens` clean; docs page driven in Chromium (clicks, arrows, disabled skip, 375px one row + scroll, reduced motion, no console errors).
- Not verified: real screen readers (NVDA / VoiceOver / TalkBack); right-to-left layouts (not handled, documented); the reports dashboard itself (it consumes this package by git; its views were not run against this branch).
- Open / separate tickets (not done here): a Blade underline variant; renaming the segmented switch to `SegmentedControl`; the existing `Badge` semantic tones are below the 4.5:1 text contrast except `info` (4.75:1): `neutral` 2.38, `success` 2.36, `warning` 1.29, `danger` 4.18 (computed from the token pairs), so the docs show counts in the `info` tone only; proposed measurements (tab padding, gap, indicator width) are not yet in `tokens.json`.
