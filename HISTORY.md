# HISTORY.md — Session Log

A running, dated log of what Claude Code sessions have done on this repo — not rules, but a record of
what happened, so a new session can catch up from this file plus `git log`. New entries go at the
**top** (most recent first). Keep each short: what was asked, what changed, what is still open.

---

## 2026-10-06 — Tabs: primary / secondary underline variants, TabPanel, docs (issue 27)

- Asked: a documented, accessible Tabs component with hierarchical navigation, distinct from SegmentedControl.
- Decision (Master KMO, "agree, proceed (a)"): `Tabs` already existed but was the pill-shaped segmented switch, used by ~8 views of the reports dashboard. It was **extended, not replaced**: new `variant` prop, default `'segmented'` = exactly the old output; `'primary'` / `'secondary'` are the new underline tabs.
- Added: `variant`, `id`, `label` on `Tabs`; `icon` / `badge` / `disabled` on `TabItem`; new `TabPanel` (`react/src/components/Tabs.tsx`); `.vs-tabs` / `.vs-tab` / `.vs-tab-panel` CSS (`react/src/styles.css`, tokens only, no new tokens). ARIA tablist pattern, roving tabindex, Left/Right/Home/End with automatic activation, horizontal scroll instead of wrapping, inset focus ring, reduced-motion respected.
- Docs: `docs/components/tabs.html` rewritten to the Search Input page layout (10 numbered sections). The old segmented / Blade nav-pills content is kept in section 06.
- Tests: first unit tests in this repo (vitest + jsdom + Testing Library, `react/vitest.config.ts`, new CI step): 32 tests. Checked: all five deliberately-broken versions of the component fail the suite; the default (segmented) render is byte-identical to the previous component for 16 prop combinations; `tsc --noEmit`, `check:tokens` clean; docs page driven in Chromium (clicks, arrows, disabled skip, 375px one row + scroll, reduced motion, no console errors).
- Not verified: real screen readers (NVDA / VoiceOver / TalkBack); right-to-left layouts (not handled, documented); the reports dashboard itself (it consumes this package by git; its views were not run against this branch).
- Open / separate tickets (not done here): a Blade underline variant; renaming the segmented switch to `SegmentedControl`; the existing `Badge` semantic tones are below the 4.5:1 text contrast except `info` (4.75:1): `neutral` 2.38, `success` 2.36, `warning` 1.29, `danger` 4.18 (computed from the token pairs), so the docs show counts in the `info` tone only; proposed measurements (tab padding, gap, indicator width) are not yet in `tokens.json`.
