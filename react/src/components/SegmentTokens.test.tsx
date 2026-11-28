import { describe, expect, it } from 'vitest';

// Issue #158: SegmentedControl theme hooks. Read the CSS with node:fs (vitest gives a CSS file as an empty string); the module name
// is a variable so tsc, which has no node types in this package, does not look it up.
const fsName = 'node:fs';
const fs: { readFileSync: (path: string, enc: string) => string } = await import(/* @vite-ignore */ fsName);
const cwd: string = (globalThis as unknown as { process: { cwd: () => string } }).process.cwd();
const tokens = fs.readFileSync(`${cwd}/../tokens/tokens.css`, 'utf8');
const styles = fs.readFileSync(`${cwd}/src/styles.css`, 'utf8');
const rule = (sel: string) => styles.match(new RegExp(`\\n${sel.replace(/[.]/g, '\\.')} \\{([^}]*)\\}`))?.[1] ?? '';

describe('SegmentedControl tokens (#158)', () => {
  it('defaults keep the default variant as before', () => {
    expect(tokens).toContain('--vs-segment-active-bg: var(--vs-color-brand-primary);');
    expect(tokens).toContain('--vs-segment-active-text: var(--vs-color-text-on-primary);');
    expect(tokens).toContain('--vs-segment-text: var(--vs-color-text-muted);');
    expect(tokens).toContain('--vs-segment-font-size: var(--vs-font-size-body-md);');
  });
  it('the default button and the selected button read the tokens', () => {
    expect(rule('.vs-segment-button')).toContain('font-size: var(--vs-segment-font-size);');
    expect(rule('.vs-segment-button')).toContain('color: var(--vs-segment-text);');
    expect(rule('.vs-segment-button.is-active')).toContain('background-color: var(--vs-segment-active-bg);');
    expect(rule('.vs-segment-button.is-active')).toContain('color: var(--vs-segment-active-text);');
  });
  it('the phone style (#156) still makes the selected option dark below 1024px', () => {
    const phone = styles.slice(styles.indexOf('@media (max-width: 1023.98px)'));
    expect(phone).toMatch(/\.vs-segment-button\.is-active\s*\{\s*background-color: var\(--vs-color-brand-secondary\);/);
  });
});
