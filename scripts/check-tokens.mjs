// Static checks for tokens/tokens.css. No dependencies. Run: npm run check:tokens
//  1. docs/assets/tokens.css is an exact copy of tokens/tokens.css; docs/assets/blade-components.css of
//     blade/components.css, which holds no raw colour literal (tokens only)
//  2. tokens.json parses
//  3. no raw colour literal outside tokens/raw-colour-allowlist.txt (and no stale allowlist entry)
//  4. the brand green is defined once: no other token may hold the same literal
//  5. contrast: primary-button text >= 4.5:1 on default/hover/pressed, focus ring >= 3:1 on the
//     light surfaces and on the dark brand surface (white ring), item card badge text >= 4.5:1 on its fill
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const errors = [];
const fail = (m) => errors.push(m);

const css = read('tokens/tokens.css');
if (css !== read('docs/assets/tokens.css')) fail('docs/assets/tokens.css differs from tokens/tokens.css (copy it)');
const bladeCss = read('blade/components.css');
if (bladeCss !== read('docs/assets/blade-components.css')) fail('docs/assets/blade-components.css differs from blade/components.css (copy it)');
for (const m of bladeCss.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g)) fail(`blade/components.css has a raw colour (${m[0]}); use a --vs-* token`);
try { JSON.parse(read('tokens/tokens.json')); } catch (e) { fail('tokens/tokens.json is not valid JSON: ' + e.message); }

const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
const tokens = new Map();
for (const m of body.matchAll(/(--vs-[a-z0-9-]+)\s*:\s*([^;]+);/g)) tokens.set(m[1], m[2].trim());

const RAW = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const rawNames = [...tokens].filter(([, v]) => RAW.test(v)).map(([k]) => k);
const allow = new Set(read('tokens/raw-colour-allowlist.txt').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));
for (const n of rawNames) if (!allow.has(n)) fail(`${n} is a raw colour (${tokens.get(n)}). Use an existing token via var(), or add it to tokens/raw-colour-allowlist.txt on purpose`);
for (const n of allow) if (!rawNames.includes(n)) fail(`allowlist entry ${n} is no longer a raw colour (remove it from tokens/raw-colour-allowlist.txt)`);

// Body type tokens must agree with the body weight token (a weight change must not leave one behind).
const weightOf = (name) => (tokens.get(name) || '').match(/^(\d{3})\s/)?.[1];
const bodyWeight = tokens.get('--vs-font-weight-body');
for (const n of ['--vs-type-paragraph', '--vs-type-body-01']) if (weightOf(n) !== bodyWeight) fail(`${n} weight ${weightOf(n)} differs from --vs-font-weight-body ${bodyWeight}`);
for (const n of ['--vs-letter-spacing-body', '--vs-letter-spacing-heading']) if (!tokens.has(n)) fail(`${n} is missing`);

const norm = (v) => v.replace(/\s+/g, '').toLowerCase();
const green = norm(tokens.get('--vs-color-brand-primary') || '');
for (const [k, v] of tokens) if (k !== '--vs-color-brand-primary' && green && norm(v) === green) fail(`${k} repeats the brand green literal; use var(--vs-color-brand-primary)`);

function resolve(name, seen = new Set()) {
  let v = tokens.get(name);
  if (v === undefined || seen.has(name)) return undefined;
  seen.add(name);
  const m = v.match(/^var\((--vs-[a-z0-9-]+)\)$/);
  return m ? resolve(m[1], seen) : v;
}
const mixBlack = (hex, pct) => '#' + [0, 2, 4].map((i) => Math.round(parseInt(hex.slice(1 + i, 3 + i), 16) * pct / 100).toString(16).padStart(2, '0')).join('');
const mixHex = (a, b, pct) => '#' + [0, 2, 4].map((i) => Math.round((parseInt(a.slice(1 + i, 3 + i), 16) * pct + parseInt(b.slice(1 + i, 3 + i), 16) * (100 - pct)) / 100).toString(16).padStart(2, '0')).join('');
function colourOf(name) { // resolve var() chains and color-mix(in srgb, X N%, black | Y) to a 6-digit hex (23 Nov 2026: a second colour, not only black)
  const v = resolve(name);
  const m = (v || '').match(/^color-mix\(in srgb,\s*(var\(--vs-[a-z0-9-]+\)|#[0-9a-fA-F]{6})\s+(\d+)%,\s*(black|var\(--vs-[a-z0-9-]+\)|#[0-9a-fA-F]{6})\)$/);
  if (!m) return v;
  const part = (x) => (x === 'black' ? '#000000' : x.startsWith('var(') ? colourOf(x.slice(4, -1)) : x);
  const base = part(m[1]);
  const other = part(m[3]);
  if (!/^#[0-9a-fA-F]{6}$/.test(base || '') || !/^#[0-9a-fA-F]{6}$/.test(other || '')) return undefined;
  return m[3] === 'black' ? mixBlack(base, Number(m[2])) : mixHex(base, other, Number(m[2]));
}
const lum = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const need = (label, fg, bg, min) => {
  const f = colourOf(fg), b = colourOf(bg);
  if (!/^#[0-9a-fA-F]{6}$/.test(f || '') || !/^#[0-9a-fA-F]{6}$/.test(b || '')) { fail(`${label}: cannot resolve ${fg} / ${bg} to a 6-digit hex`); return; }
  const r = ratio(f, b);
  if (r < min) fail(`${label}: contrast ${r.toFixed(2)}:1 is below ${min}:1 (${fg} ${f} on ${bg} ${b})`);
};
need('text on the brand green', '--vs-color-text-on-primary', '--vs-color-brand-primary', 4.5);
for (const s of ['', '-hover', '-pressed']) need(`primary button text on ${s || 'default'}`, '--vs-button-primary-text', `--vs-button-primary${s}`, 4.5);
need('brand green as text on surface', '--vs-color-brand-primary-text', '--vs-color-surface', 4.5);
need('brand green as text on background', '--vs-color-brand-primary-text', '--vs-color-background', 4.5);
for (const t of ['success', 'warning', 'danger', 'info']) for (const txt of ['text-body', 'text-heading']) need(`alert ${txt} on ${t} fill`, `--vs-color-${txt}`, `--vs-color-${t}-bg`, 4.5);
for (const t of ['success', 'error', 'warning', 'info']) need(`toast text on ${t}`, '--vs-toast-text', `--vs-toast-${t}`, 4.5);
// Premium: white on dark gold is the owner's choice (6 Oct 2026), 2.8:1. Accepted exception, gated so it cannot get lighter.
const BADGE_MIN = { premium: 2.5, sale: 4.5, free: 4.5, trending: 4.5 };
for (const b of Object.keys(BADGE_MIN)) need(`item card ${b} badge text`, `--vs-card-badge-${b}-text`, `--vs-color-badge-${b}`, BADGE_MIN[b]);
need('focus ring on surface', '--vs-focus-ring-color', '--vs-color-surface', 3);
need('focus ring on background', '--vs-focus-ring-color', '--vs-color-background', 3);
need('focus ring on dark surface', '--vs-focus-ring-color-on-dark', '--vs-color-brand-secondary', 3);
// Dashboard direction (23 Nov 2026): dark text on the lime action colour, and the new chart colours as graphics (WCAG 1.4.11: 3:1) on white.
need('dark text on the lime action colour', '--vs-color-brand-secondary', '--vs-color-brand-accent', 4.5);
for (const t of ['--vs-chart-line-primary', '--vs-chart-series-downloads', '--vs-chart-today-marker']) need(`${t} on surface`, t, '--vs-color-surface', 3);
// Additive tokens must exist and keep pointing at the intended primitives (the old values stay as they are).
const expectTokens = { '--vs-card-radius-lg': 'var(--vs-radius-xl)', '--vs-chart-series-downloads': 'var(--vs-color-badge-free)', '--vs-chart-today-marker': 'var(--vs-color-brand-secondary)' };
for (const [n, v] of Object.entries(expectTokens)) if (tokens.get(n) !== v) fail(`${n} should be ${v}, found ${tokens.get(n)}`);
for (const n of ['--vs-color-lavender-surface', '--vs-color-lavender-surface-strong', '--vs-gradient-header-lavender', '--vs-chart-line-primary']) if (!tokens.has(n)) fail(`${n} is missing`);

// Accent button and dark SegmentedControl (Task 2, 23 Nov 2026): opt-in, additive. Dark text must stay readable on every lime state,
// the dark selected option needs white text, and the inactive text of the dark variant must pass AA on white.
const expectAccent = { '--vs-button-accent': 'var(--vs-color-brand-accent)', '--vs-button-accent-text': 'var(--vs-color-brand-secondary)', '--vs-button-accent-font-weight': '700' };
for (const [n, v] of Object.entries(expectAccent)) if (tokens.get(n) !== v) fail(`${n} should be ${v}, found ${tokens.get(n)}`);
for (const s of ['', '-hover', '-pressed']) need(`accent button text on ${s || 'default'}`, '--vs-button-accent-text', `--vs-button-accent${s}`, 4.5);
need('dark segmented control: white on the dark selected option', '--vs-color-surface', '--vs-color-brand-secondary', 4.5);
need('dark segmented control: inactive text on white', '--vs-color-text-body', '--vs-color-surface', 4.5);
// The component stylesheet must hold the rules the new variants rely on (hover/pressed shades; dark pill, selected and inactive colours).
const styles = read('react/src/styles.css').replace(/\/\*[\s\S]*?\*\//g, '');
const ruleBody = (sel) => { const i = styles.indexOf(sel + ' {'); return i < 0 ? null : styles.slice(i, styles.indexOf('}', i)); };
const needRule = (sel, part) => { const b = ruleBody(sel); if (b === null) fail(`react/src/styles.css has no rule "${sel}"`); else if (!b.includes(part)) fail(`react/src/styles.css "${sel}" must contain "${part}"`); };
needRule('.vs-btn--accent:hover:not(:disabled)', 'var(--vs-button-accent-hover)');
needRule('.vs-btn--accent:active:not(:disabled)', 'var(--vs-button-accent-pressed)');
needRule('.vs-segment-control--dark', 'border-radius: var(--vs-radius-full)');
needRule('.vs-segment-control--dark .vs-segment-button', 'color: var(--vs-color-text-body)');
needRule('.vs-segment-control--dark .vs-segment-button.is-active', 'background-color: var(--vs-color-brand-secondary)');
needRule('.vs-segment-control--dark .vs-segment-button.is-active', 'color: var(--vs-color-surface)');

// SummaryCard dark tone and metric variant (Task 3, 23 Nov 2026): every text/background pair the new styles use must pass WCAG AA (4.5:1).
need('summary change chip: danger text on the danger fill', '--vs-color-danger-text', '--vs-color-danger-bg', 4.5);
need('summary change chip: brand green text on the success fill', '--vs-color-brand-primary-text', '--vs-color-success-bg', 4.5);
need('summary change chip / icon: body text on the disabled fill', '--vs-color-text-body', '--vs-color-disabled-bg', 4.5);
need('summary icon: heading colour on the disabled fill', '--vs-color-text-heading', '--vs-color-disabled-bg', 4.5);
need('summary dark: lime value on the dark surface', '--vs-color-brand-accent', '--vs-color-brand-secondary', 4.5);
need('summary dark: muted unit and description on the dark surface', '--vs-color-text-muted', '--vs-color-brand-secondary', 4.5);
need('summary dark: white label on the dark surface', '--vs-color-surface', '--vs-color-brand-secondary', 4.5);
for (const [n, v] of Object.entries({ '--vs-summary-value-letter-spacing': '-0.05em', '--vs-color-danger-text': 'color-mix(in srgb, var(--vs-color-danger-border) 85%, black)' })) if (tokens.get(n) !== v) fail(`${n} should be ${v}, found ${tokens.get(n)}`);
needRule('.vs-summary-card--metric', 'border-radius: var(--vs-card-radius-lg)');
needRule('.vs-summary-card--metric .vs-summary-figure-value', 'letter-spacing: var(--vs-summary-value-letter-spacing)');
needRule('.vs-summary-card--dark', 'background: var(--vs-color-brand-secondary)');
needRule('.vs-summary-card--dark', '--vs-chart-series-1: var(--vs-color-brand-accent)');
needRule('.vs-summary-card--dark .vs-summary-figure-value', 'color: var(--vs-color-brand-accent)');
needRule('.vs-summary-change--up', 'color: var(--vs-color-brand-primary-text)');
needRule('.vs-summary-change--down', 'color: var(--vs-color-danger-text)');
needRule('.vs-summary-change--flat', 'color: var(--vs-color-text-body)');
needRule('.vs-summary-icon', 'border-radius: var(--vs-radius-lg)');

// Meter and BreakdownList (Task 4, 23 Nov 2026, issue #25): every fill must be at least 3:1 on the track (WCAG 1.4.11; the plain warning
// yellow is 1.19:1 and the plain success green 2.27:1 there), the tokens point at their primitives, and the stylesheet draws them from the tokens.
for (const f of ['', '-success', '-warning', '-danger', '-neutral']) need(`meter fill${f || ' (default)'} on the track`, `--vs-meter-fill${f}`, '--vs-meter-track', 3);
const expectMeter = {
  '--vs-meter-height': '6px',
  '--vs-meter-track': 'var(--vs-color-disabled-bg)',
  '--vs-meter-fill': 'var(--vs-color-brand-primary-text)',
  '--vs-meter-fill-danger': 'var(--vs-color-danger-border)',
};
for (const [n, v] of Object.entries(expectMeter)) if (tokens.get(n) !== v) fail(`${n} should be ${v}, found ${tokens.get(n)}`);
for (const n of ['--vs-meter-fill-success', '--vs-meter-fill-warning', '--vs-meter-fill-neutral']) if (!/^color-mix\(in srgb, var\(--vs-color-[a-z-]+\) \d+%, black\)$/.test(tokens.get(n) || '')) fail(`${n} must be a status colour mixed with black, found ${tokens.get(n)}`);
needRule('.vs-meter', 'height: var(--vs-meter-height)');
needRule('.vs-meter', 'background: var(--vs-meter-track)');
needRule('.vs-meter', '--vs-meter-current: var(--vs-meter-fill)');
needRule('.vs-meter__fill', 'background: var(--vs-meter-current)');
for (const t of ['success', 'warning', 'danger', 'neutral']) {
  needRule(`.vs-meter--${t}`, `--vs-meter-current: var(--vs-meter-fill-${t})`);
  needRule(`.vs-meter__tick--${t}`, `background: var(--vs-meter-fill-${t})`);
}
needRule('.vs-breakdown__share', 'color: var(--vs-color-text-body)');
need('breakdown: share text on white', '--vs-color-text-body', '--vs-color-surface', 4.5);
need('breakdown: name and count on white', '--vs-color-text-heading', '--vs-color-surface', 4.5);

// DonutChart (Task 5, 23 Nov 2026, issue #72): the six segment colours are at least 3:1 on white (WCAG 1.4.11), they point at their primitives,
// the ring track is the meter track, the draw-in animation exists and is switched off under reduced motion.
for (let i = 1; i <= 6; i++) need(`donut segment ${i} on white`, `--vs-chart-donut-${i}`, '--vs-color-surface', 3);
const expectDonut = {
  '--vs-chart-donut-1': 'var(--vs-color-brand-secondary)',
  '--vs-chart-donut-2': 'var(--vs-color-brand-primary-text)',
  '--vs-chart-donut-3': 'var(--vs-color-badge-free)',
  '--vs-chart-donut-4': 'var(--vs-color-badge-trending)',
  '--vs-chart-donut-5': 'color-mix(in srgb, var(--vs-color-text-muted) 70%, black)',
  '--vs-chart-donut-6': 'color-mix(in srgb, var(--vs-color-badge-free) 70%, var(--vs-color-surface))',
};
for (const [n, v] of Object.entries(expectDonut)) if (tokens.get(n) !== v) fail(`${n} should be ${v}, found ${tokens.get(n)}`);
const needPattern = (re, what) => { if (!re.test(styles)) fail(`react/src/styles.css: ${what}`); };
needPattern(/\.vs-donut__seg\s*\{\s*animation:\s*vs-donut-draw[^;]*;/, 'the .vs-donut__seg draw-in animation is missing');
needPattern(/@keyframes vs-donut-draw\s*\{\s*from\s*\{\s*stroke-dasharray:\s*0 var\(--vs-donut-total\);/, '@keyframes vs-donut-draw must start from an empty dash');
needPattern(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.vs-donut__seg\s*\{\s*animation:\s*none;/, 'the donut draw-in must be switched off under prefers-reduced-motion');
needRule('.vs-donut__center-value', 'color: var(--vs-color-text-heading)');
needRule('.vs-donut__center-caption', 'color: var(--vs-color-text-body)');
needRule('.vs-donut__legend-label', 'color: var(--vs-color-text-body)');
needRule('.vs-donut__legend-pct', 'color: var(--vs-color-text-heading)');

if (errors.length) { console.error('check-tokens FAILED:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log(`check-tokens OK (${tokens.size} tokens, ${rawNames.length} approved raw colours)`);
