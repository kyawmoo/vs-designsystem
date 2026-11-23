import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { SegmentedControl } from './SegmentedControl';

afterEach(cleanup);

// The markup of every existing SegmentedControl combination as it was BEFORE the `variant` prop was added (Task 2, 23 Nov 2026).
const BEFORE = {
  seg_md: "<div class=\"vs-segment-control\"><button type=\"button\" class=\"vs-segment-button  is-active \">Today</button><button type=\"button\" class=\"vs-segment-button   \">7D</button><button type=\"button\" class=\"vs-segment-button   \">90D</button></div>",
  seg_sm: "<div class=\"vs-segment-control\"><button type=\"button\" class=\"vs-segment-button vs-segment-button--sm  \">Today</button><button type=\"button\" class=\"vs-segment-button vs-segment-button--sm is-active \">7D</button><button type=\"button\" class=\"vs-segment-button vs-segment-button--sm  \">90D</button></div>",
  seg_none_active: "<div class=\"vs-segment-control\"><button type=\"button\" class=\"vs-segment-button   \">Today</button><button type=\"button\" class=\"vs-segment-button   \">7D</button><button type=\"button\" class=\"vs-segment-button   \">90D</button></div>",
  seg_classes: "<div class=\"vs-segment-control mine\"><button type=\"button\" class=\"vs-segment-button   btn-x\">Today</button><button type=\"button\" class=\"vs-segment-button   btn-x\">7D</button><button type=\"button\" class=\"vs-segment-button  is-active btn-x\">90D</button></div>",
} as const;

const tabs = [
  { id: 'a', label: 'Today' },
  { id: 'b', label: '7D' },
  { id: 'c', label: '90D' },
];
const noop = () => {};

describe('SegmentedControl: existing output is unchanged', () => {
  it('md, sm, nothing active, extra classes', () => {
    expect(renderToStaticMarkup(<SegmentedControl tabs={tabs} activeId="a" onChange={noop} />)).toBe(BEFORE.seg_md);
    expect(renderToStaticMarkup(<SegmentedControl tabs={tabs} activeId="b" onChange={noop} size="sm" />)).toBe(BEFORE.seg_sm);
    expect(renderToStaticMarkup(<SegmentedControl tabs={tabs} activeId="" onChange={noop} />)).toBe(BEFORE.seg_none_active);
    expect(renderToStaticMarkup(<SegmentedControl tabs={tabs} activeId="c" onChange={noop} className="mine" buttonClassName="btn-x" />)).toBe(BEFORE.seg_classes);
  });
});

describe('SegmentedControl: dark variant (opt-in)', () => {

  it('adds only the dark class to the track; the buttons keep the same classes', () => {
    const dark = renderToStaticMarkup(<SegmentedControl tabs={tabs} activeId="b" onChange={noop} variant="dark" />);
    expect(dark).toContain('<div class="vs-segment-control vs-segment-control--dark">');
    const plain = renderToStaticMarkup(<SegmentedControl tabs={tabs} activeId="b" onChange={noop} />);
    expect(dark.replace(' vs-segment-control--dark', '')).toBe(plain);
    expect(renderToStaticMarkup(<SegmentedControl tabs={tabs} activeId="a" onChange={noop} variant="dark" size="sm" className="mine" />)).toContain(
      '<div class="vs-segment-control vs-segment-control--dark mine">'
    );
  });

  it('variant="default" is the same as no variant', () => {
    expect(renderToStaticMarkup(<SegmentedControl tabs={tabs} activeId="a" onChange={noop} variant="default" />)).toBe(BEFORE.seg_md);
  });

  it('still switches the active option on click and tells exactly one it is active', async () => {
    let picked = '';
    render(<SegmentedControl tabs={tabs} activeId="a" onChange={(id) => (picked = id)} variant="dark" />);
    await userEvent.click(screen.getByRole('button', { name: '90D' }));
    expect(picked).toBe('c');
    expect(document.querySelectorAll('.vs-segment-button.is-active').length).toBe(1);
  });
});
