import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Select } from './Select';
import type { SelectOption } from './Select';

const render = (props: Partial<React.ComponentProps<typeof Select>> = {}) =>
  renderToStaticMarkup(<Select name="f" options={[{ value: 'a', label: 'A' }]} {...props} />);

describe('Select groups', () => {
  it('renders plain options with no optgroup when no option has a group', () => {
    const html = render({ options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] });
    expect(html).not.toContain('<optgroup');
    expect(html).toContain('<option value="a">A</option><option value="b">B</option>');
  });
  it('puts options with the same group under one optgroup, groups in first-seen order', () => {
    const options: SelectOption[] = [
      { value: '', label: 'All' },
      { value: '1', label: 'Cat', group: 'Animals' },
      { value: '2', label: 'Car', group: 'Vehicles' },
      { value: '3', label: 'Dog', group: 'Animals' },
    ];
    const html = render({ options });
    expect(html.match(/<optgroup/g)).toHaveLength(2);
    expect(html.indexOf('label="Animals"')).toBeLessThan(html.indexOf('label="Vehicles"'));
    expect(html).toMatch(/<optgroup label="Animals"><option value="1">Cat<\/option><option value="3">Dog<\/option><\/optgroup>/);
  });
  it('keeps ungrouped options first, even when they come later in the list', () => {
    const html = render({
      options: [
        { value: '1', label: 'Cat', group: 'Animals' },
        { value: '', label: 'All' },
      ],
    });
    expect(html.indexOf('>All<')).toBeLessThan(html.indexOf('<optgroup'));
  });
  it('treats an empty group name as no group', () => {
    expect(render({ options: [{ value: 'a', label: 'A', group: '' }] })).not.toContain('<optgroup');
  });
  it('escapes group and option text', () => {
    const html = render({ options: [{ value: 'a', label: '<b>x</b>', group: '<i>g</i>' }] });
    expect(html).not.toContain('<b>x</b>');
    expect(html).not.toContain('<i>g</i>');
  });
});

describe('Select size and name', () => {
  it('keeps md and lg as they were', () => {
    expect(render()).toContain('font-size:16px');
    expect(render({ size: 'lg' })).toContain('font-size:14px');
  });
  it('sm is the compact size', () => {
    const html = render({ size: 'sm' });
    expect(html).toContain('font-size:12px');
    expect(html).toContain('padding:6px 30px 6px 10px');
  });
  it('renders without a name attribute when none is given', () => {
    const html = renderToStaticMarkup(<Select options={[{ value: 'a', label: 'A' }]} />);
    expect(html).not.toContain(' name=');
  });
  it('still uses name for the field and label ids', () => {
    expect(render({ label: 'L' })).toContain('id="f"');
  });
});
