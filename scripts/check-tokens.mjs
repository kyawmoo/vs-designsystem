// Static checks for tokens/tokens.css. No dependencies. Run: npm run check:tokens
//  1. docs/assets/tokens.css is an exact copy of tokens/tokens.css; docs/assets/blade-components.css of
//     blade/components.css, which holds no raw colour literal (tokens only)
//  2. tokens.json parses
//  3. no raw colour literal outside tokens/raw-colour-allowlist.txt (and no stale allowlist entry)
//  4. the brand green is defined once: no other token may hold the same literal
//  5. contrast: primary-button text >= 4.5:1 on default/hover/pressed, focus ring >= 3:1 on the
//     light surfaces and on the dark brand surface (white ring), item card badge text >= 4.5:1 on its fill
//  6. motion tokens: durations in ms, easings are cubic-bezier(), rise distance in px, and tokens.json holds the same values
//  7. the Reveal CSS block (vs-reveal:start ... vs-reveal:end) is identical in react/src/styles.css and blade/components.css,
//     and every --vs-* token it reads exists
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
function colourOf(name) { // resolve var() chains and color-mix(in srgb, X N%, black) to a 6-digit hex
  const v = resolve(name);
  const m = (v || '').match(/^color-mix\(in srgb,\s*(var\(--vs-[a-z0-9-]+\)|#[0-9a-fA-F]{6})\s+(\d+)%,\s*black\)$/);
  if (!m) return v;
  const base = m[1].startsWith('var(') ? colourOf(m[1].slice(4, -1)) : m[1];
  return /^#[0-9a-fA-F]{6}$/.test(base || '') ? mixBlack(base, Number(m[2])) : undefined;
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

// Motion tokens (page-opening Reveal). Shape check, and tokens.json must say the same as tokens.css.
const MOTION = { 'duration-curtain': /^\d+ms$/, 'duration-enter': /^\d+ms$/, 'delay-body': /^\d+ms$/, 'ease-standard': /^cubic-bezier\(\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*\)$/, 'ease-decelerate': /^cubic-bezier\(\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*\)$/, 'rise-distance': /^\d+px$/, 'text-duration': /^\d+ms$/, 'text-stagger': /^\d+ms$/ };
let tokensJson = {};
try { tokensJson = JSON.parse(read('tokens/tokens.json')); } catch { /* already reported above */ }
for (const [name, shape] of Object.entries(MOTION)) {
  const cssName = `--vs-motion-${name}`;
  const cssValue = tokens.get(cssName);
  if (cssValue === undefined) { fail(`${cssName} is missing from tokens.css`); continue; }
  if (!shape.test(cssValue)) fail(`${cssName} has an unexpected value (${cssValue})`);
  const jsonValue = tokensJson.motion?.[name]?.value;
  if (jsonValue === undefined) fail(`motion.${name} is missing from tokens.json`);
  else if (norm(jsonValue) !== norm(cssValue)) fail(`motion.${name} in tokens.json (${jsonValue}) differs from ${cssName} in tokens.css (${cssValue})`);
}

// Reveal CSS: one block, kept in two files (React and Blade), must not drift apart; every token it reads must exist.
const revealBlock = (src) => src.match(/\/\* vs-reveal:start[\s\S]*?\/\* vs-reveal:end \*\//)?.[0];
const reactReveal = revealBlock(read('react/src/styles.css'));
const bladeReveal = revealBlock(bladeCss);
if (!reactReveal) fail('react/src/styles.css has no vs-reveal block (vs-reveal:start ... vs-reveal:end)');
if (!bladeReveal) fail('blade/components.css has no vs-reveal block (vs-reveal:start ... vs-reveal:end)');
if (reactReveal && bladeReveal && reactReveal !== bladeReveal) fail('the vs-reveal block differs between react/src/styles.css and blade/components.css (copy one into the other)');
for (const m of (reactReveal || '').replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/var\((--vs-[a-z0-9-]+)\)/g)) if (!tokens.has(m[1]) && !m[1].startsWith('--vs-reveal-')) fail(`the vs-reveal block reads ${m[1]}, which tokens.css does not define`);

// RevealText: the script rule (which texts may be split into letters) is written twice, in Reveal.tsx and in the Blade component.
// Both must give the expected answer on the shared fixtures. The PHP side runs only where `php` exists (GitHub's ubuntu runners have it).
{
  const fixtures = JSON.parse(read('react/src/fixtures-reveal-text-scripts.json'));
  const jsSrc = read('react/src/components/Reveal.tsx').match(/const SPLITTABLE = (\/.*\/u);/)?.[1];
  const phpSrc = read('blade/components/vs-reveal-text.blade.php').match(/\$splittable = preg_match\('(\/.*\/u)', \$plain\) === 1;/)?.[1];
  if (!jsSrc) fail('could not find the SPLITTABLE rule in react/src/components/Reveal.tsx');
  if (!phpSrc) fail('could not find the $splittable rule in blade/components/vs-reveal-text.blade.php');
  if (jsSrc && phpSrc) {
    const re = new Function(`return ${jsSrc};`)();
    for (const f of fixtures) if (re.test(f.text) !== f.split) fail(`RevealText script rule (React) gives ${!f.split} for ${JSON.stringify(f.text)}, expected ${f.split}`);
    const { spawnSync } = await import('node:child_process');
    const probe = spawnSync('php', ['-r', 'echo PHP_VERSION;'], { encoding: 'utf8' });
    if (probe.status !== 0) {
      console.log('check-tokens: php not found, the Blade script rule was not run against the fixtures');
    } else {
      const script = `$f = json_decode(file_get_contents('php://stdin'), true); $out = []; foreach ($f as $x) { $out[] = preg_match(${JSON.stringify(phpSrc).replace(/\$/g, '\\$')}, $x['text']) === 1; } echo json_encode($out);`;
      const run = spawnSync('php', ['-r', script], { input: JSON.stringify(fixtures), encoding: 'utf8' });
      if (run.status !== 0) fail(`php could not run the script rule: ${run.stderr}`);
      else JSON.parse(run.stdout).forEach((got, i) => { if (got !== fixtures[i].split) fail(`RevealText script rule (Blade) gives ${got} for ${JSON.stringify(fixtures[i].text)}, expected ${fixtures[i].split}`); });
    }
  }
}

// The Blade count-up script has a copy for the docs site; they must be the same file.
if (read('blade/animated-number.js') !== read('docs/assets/animated-number.js')) fail('docs/assets/animated-number.js differs from blade/animated-number.js (copy it)');

if (errors.length) { console.error('check-tokens FAILED:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log(`check-tokens OK (${tokens.size} tokens, ${rawNames.length} approved raw colours)`);
