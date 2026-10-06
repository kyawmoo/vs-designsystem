# HISTORY.md — Session Log

A running, dated log of what Claude Code sessions have done on this repo — not rules, but a record of
what happened, so a new session can catch up from this file plus `git log`. New entries go at the
**top** (most recent first). Keep each short: what was asked, what changed, what is still open.

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
