# HISTORY.md — Session Log

A running, dated log of what Claude Code sessions have done on this repo — not rules, but a record of
what happened, so a new session can catch up from this file plus `git log`. New entries go at the
**top** (most recent first). Keep each short: what was asked, what changed, what is still open.

---

## 2026-11-01 — RangeCalendar (pick a From and a To day); not deployed

- Asked: second of three PRs for the custom date range (after Popover). Master KMO's answers: week starts on Sunday (`weekStartsOn` 0 default, 1 = Monday), no typing in date fields in v1 (those belong to the opener, not this component), dates shown `DD MMM YYYY`, values passed as `'YYYY-MM-DD'` text, the page sets `maxDays` / `minDate` / `maxDate` (defaults 365 / none / today).
- Added: `RangeCalendar` (`react/src/components/RangeCalendar.tsx`, exported with `RangeCalendarProps`, `DateRangeValue`) and the pure helpers in `rangeCalendarDates.ts` (exported: `addDays`, `daysInclusive`, `formatDMY`, `formatRangeLabel`, `isIsoDate`, `todayIsoDate`, types `IsoDate`, `WeekStart`); `.vs-rc-*` CSS in `react/src/styles.css` (tokens; ends in the brand colour, the band is a `color-mix` tint of it). One or two months side by side (`months`); first click = From, second = To (reverse order swaps, same day twice = one day, a click after a finished range starts a new one); days outside `minDate`..`maxDate` are disabled; while the second date is pending, days that would make a range longer than `maxDays` are disabled on both sides; hover or keyboard focus previews the band; month arrows stop at the first / last month that can be picked; one tab stop, arrows (day / week), Home / End (week ends, follows `weekStartsOn`), PageUp / PageDown (month), Enter / Space; every day button is named by its full date, `aria-pressed` on the ends, `aria-current="date"` on today. Dates are calendar-day text, so no time zone can shift a day.
- Docs: `docs/components/range-calendar.html` (live click / hover demo using the real component's markup rendered to HTML, three states, behaviour, measurements, usage, props) and a sidebar entry.
- Tests: `rangeCalendarDates.test.ts` (13: parsing incl. leap day and impossible dates, adding days / months across month and year ends, inclusive day counts, month grids for both week starts, labels) and `RangeCalendar.test.tsx` (25: what is shown, picking, swapping, one-day range, new range, limits incl. `maxDays` off-by-one both sides, keyboard incl. not moving onto a disabled day, preview); `npm test` 203/203 (was 165), `tsc` clean, `check:tokens` OK. Mutation checks, each fails at least one test: no swap, max date ignored, min date ignored, `maxDays` ignored, `maxDays` off by one, no ArrowRight, End one day off, no month scroll, keyboard enters a disabled day (this one survived the first version of the tests; a test was added), every day a tab stop, preview never clears, next arrow never disabled, finished range keeps extending, today ring on every day, week start ignored. The real component in Chromium (760px and 390px): 40px day circles in 44px rows, the band runs across week edges with rounded ends, preview band while hovering, picked ends in the brand colour with dark text, future days disabled, real keyboard focus (ring 2px) and PageUp scrolling the month, one month at 390px with both arrows and no sideways scroll. Docs page at 1400px and 390px: demo picks, previews, swaps and ignores a disabled day; no page errors.
- Not verified: screen readers; real touch; very large `maxDays` or `minDate` far in the past (the month arrows work, but not exercised for years); the docs-site redeploy; the reports site using it.

---

## 2026-11-01 — Popover (panel under a button; bottom sheet on a phone); not deployed

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
