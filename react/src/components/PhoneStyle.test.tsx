import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Card } from './Card';

// Issue #156 (spike #67, decision b): the phone style lives in styles.css under one media query. jsdom does not apply media
// queries, so these tests read the rules; a Chromium check of the computed styles is in the pull request.
// Read with node:fs (vitest gives a CSS file as an empty string, even with ?raw). The module name is a variable so tsc, which has no
// node types in this package, does not look it up.
const fsName = 'node:fs';
const fs: { readFileSync: (path: string, enc: string) => string } = await import(/* @vite-ignore */ fsName);
const cwd: string = (globalThis as unknown as { process: { cwd: () => string } }).process.cwd();
const css: string = fs.readFileSync(`${cwd}/src/styles.css`, 'utf8');
const phone = css.slice(css.indexOf('@media (max-width: 1023.98px)'));
const block = phone.slice(0, phone.indexOf('\n}\n') + 3);

describe('phone style (below 1024px)', () => {
  it('exists as one media query at 1023.98px', () => {
    expect(css).toContain('@media (max-width: 1023.98px)');
    expect(block.length).toBeGreaterThan(50);
  });
  it('gives cards, summary cards and framed tables the large card radius; a bare table keeps none', () => {
    expect(block).toMatch(/\.vs-card,\s*\.vs-summary-card,\s*\.vs-table-card:not\(\.vs-table-card--bare\)\s*\{\s*border-radius: var\(--vs-card-radius-lg\);/);
  });
  it('gives a card inside a card the smaller radius', () => {
    expect(block).toMatch(/:is\(\.vs-card, \.vs-summary-card, \.vs-table-card\) :is\([^)]*\)[^{]*\{\s*border-radius: var\(--vs-radius-lg\);/);
  });
  it('makes segmented controls a pill with a dark selected option, tokens only', () => {
    expect(block).toMatch(/\.vs-segment-control,\s*\.vs-segment-button\s*\{\s*border-radius: var\(--vs-radius-full\);/);
    expect(block).toMatch(/\.vs-segment-button\.is-active\s*\{\s*background-color: var\(--vs-color-brand-secondary\);\s*color: var\(--vs-color-surface\);/);
    expect(block).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
});

describe('Card corner moved to CSS (so the media query can change it)', () => {
  it('has no inline border-radius, and the class sets the desktop radius', () => {
    const html = renderToStaticMarkup(<Card>x</Card>);
    expect(html).toContain('class="vs-card"');
    expect(html).not.toContain('border-radius');
    expect(css).toMatch(/\.vs-card \{\s*border-radius: var\(--vs-card-radius\);/);
  });
  it('a style prop can still set its own radius', () => {
    expect(renderToStaticMarkup(<Card style={{ borderRadius: 3 }}>x</Card>)).toContain('border-radius:3px');
  });
});
