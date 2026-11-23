import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';
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
